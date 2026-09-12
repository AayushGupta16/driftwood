import { parsePolicy, type ApprovalPolicy } from './model.ts';
async function request(path: string, init?: RequestInit): Promise<unknown> {
 const response = await fetch(path,{credentials:'include',...init});
 if (!response.ok) {
  let message = `Could not update approvals (${response.status}).`;
  try { const body = await response.json(); if (typeof body.error?.detail === 'string') message = body.error.detail; } catch { /* Keep HTTP failure. */ }
  throw new Error(message);
 }
 return response.json();
}
export async function getPolicy(signal?: AbortSignal) { return parsePolicy(await request('/api/v1/dashboard/org/approval-policy',{signal})); }
export async function savePolicy(policy: ApprovalPolicy) {
 const saved = parsePolicy(await request('/api/v1/dashboard/org/approval-policy',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:policy.mode,campaign_reviewers:policy.campaign_reviewers,expected_version:policy.version})}));
 if (saved.mode !== policy.mode || saved.version <= policy.version || JSON.stringify(Object.entries(saved.campaign_reviewers).sort()) !== JSON.stringify(Object.entries(policy.campaign_reviewers).sort())) throw new Error('The approval settings were not saved. Refresh and try again.');
 return saved;
}
export async function approveItems(itemIds: string[], version: number) {
 const result = await request('/api/v1/dashboard/reviews/decide',{method:'POST',headers:{'Content-Type':'application/json','If-Match':String(version)},body:JSON.stringify(itemIds.map((item_id) => ({item_id,decision:'approve',reason:''})))}) as {approved:number;skipped:string[]};
 if (!Number.isInteger(result.approved) || !Array.isArray(result.skipped)) throw new Error('Approval was not confirmed. Refresh the pending list before trying again.');
 return result;
}
