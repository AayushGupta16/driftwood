import type { MetricPerson } from '../analytics/model';
export type InboxStatus = 'queued' | 'sending' | 'sent' | 'reply' | 'approval' | 'failed';
export type InboxFilter = 'queued' | 'pending' | 'sent' | 'reply';
const QUEUED_STATUSES = new Set<InboxStatus>(['queued', 'sending', 'failed']);
export type Message = { reviewId?: string; reviewer?: 'customer' | 'driftwood'; canDecide?: boolean; approvalVersion?: number; campaignId?: string | null; id: string; status: InboxStatus; channel: string; name: string; company: string | null; title: string | null; email: string | null; subject: string | null; body: string | null; at: string; dueAt?: string | null; projectedDate?: string | null; automatic?: boolean; reason?: string | null };
export type SendRecord = { id: string; kind: string; status: string; subject?: string | null; note: string; created_at: string; due_at: string; sent_at?: string | null; projected_date?: string | null; error?: string | null; lead: { name: string | null; company: string | null; title: string | null; email?: string | null } | null };
export type ApprovalRecord = { reviewer?: 'customer' | 'driftwood'; can_decide?: boolean; approval_policy_version?: number; campaign_id?: string | null; id: string; kind: string; status: string; subject: string | null; body: string; created_at: string; lead: SendRecord['lead'] };
export const statusLabel: Record<InboxStatus, string> = { queued: 'Scheduled', sending: 'Sending now', sent: 'Sent', reply: 'Received', approval: 'Awaiting approval', failed: 'Needs attention' };
export function channelFor(kind: string): string { return kind.includes('email') ? 'Email' : kind.includes('x_') || kind.includes('twitter') ? 'X' : 'LinkedIn'; }
export function fromSend(row: SendRecord): Message | null {
  const status = row.status === 'pending' ? 'queued' : row.status;
  if (!['queued','sending','sent','failed'].includes(status)) return null;
  return { id:`send:${row.id}`, status:status as InboxStatus, channel:channelFor(row.kind), name:row.lead?.name ?? 'Unknown recipient', company:row.lead?.company ?? null, title:row.lead?.title ?? null, email:row.lead?.email ?? null, subject:row.subject ?? null, body:row.note, at:row.sent_at ?? row.created_at, dueAt:row.due_at, projectedDate:row.projected_date, reason:row.error };
}
export function fromReply(row: MetricPerson): Message {
  return { id:`reply:${row.leadId}:${row.channel}:${row.occurredAt}:${row.source}`, status:'reply', channel:row.channel === 'email' ? 'Email' : row.channel === 'x' ? 'X' : row.channel === 'linkedin' ? 'LinkedIn' : 'Unattributed', name:row.name ?? row.email ?? 'Unknown sender', company:row.companyName, title:row.title, email:row.email, subject:row.replySubject, body:row.replyText, at:row.occurredAt, automatic:row.replyIsAutomatic, reason:row.replyAutoReason };
}
export function fromApproval(row: ApprovalRecord): Message | null {
  if (row.status !== 'pending' || !['send_email','send_message','send_connection','send_x_dm'].includes(row.kind)) return null;
  return { reviewId:row.id,reviewer:row.reviewer,canDecide:row.can_decide === true,approvalVersion:row.approval_policy_version,campaignId:row.campaign_id,id:`approval:${row.id}`, status:'approval', channel:channelFor(row.kind), name:row.lead?.name ?? 'Unknown recipient', company:row.lead?.company ?? null, title:row.lead?.title ?? null, email:row.lead?.email ?? null, subject:row.subject, body:row.body, at:row.created_at };
}
export function filterMessages(rows: Message[], filter: InboxFilter, query: string, channel: string, replies: string): Message[] {
 return rows.filter((row) => (filter === 'queued' ? QUEUED_STATUSES.has(row.status) : filter === 'pending' ? row.status === 'approval' : row.status === filter) && (channel === 'all' || row.channel === channel) && (filter !== 'reply' || replies === 'all' || (replies === 'automatic' ? row.automatic : !row.automatic)) && [row.name,row.company,row.subject,row.body].join(' ').toLowerCase().includes(query.trim().toLowerCase())).sort((a,b) => filter === 'queued' ? Date.parse(a.dueAt ?? a.at) - Date.parse(b.dueAt ?? b.at) : Date.parse(b.at) - Date.parse(a.at));
}
