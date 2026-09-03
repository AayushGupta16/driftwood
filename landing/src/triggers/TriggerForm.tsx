/* The trigger form: one box. The customer says what to watch in their own
   words and the agent works out the source, the words, the places, the
   schedule and what happens to each item. The only other control is the
   campaign the new leads should feed, and it is optional.

   Edit is the same box. Changing the sentence sends the trigger back to
   Building while the agent rebuilds how it checks, which is also the way
   out of a source it could not read. */

import { useEffect, useState, type FormEvent } from "react";
import { createTrigger, updateTrigger } from "./api";
import type { Trigger } from "./model";
import { listCampaigns } from "../campaigns/api";
import type { CampaignSummary } from "../campaigns/model";
import { withMockMode } from "../mock-mode";

/* The placeholder rotates so the box never reads as one customer's
   business: a board, a funding watch, a product watch, and one with an
   address pasted in. */
const WATCH_EXAMPLES = [
  "New warehouse jobs at logistics companies in Texas",
  "Companies that just raised a Series A in climate tech",
  "New product launches from robotics companies",
  "New contracts on https://sam.gov for IT services",
];

function pickExample(): string {
  return WATCH_EXAMPLES[Math.floor(Math.random() * WATCH_EXAMPLES.length)];
}

type Props =
  | { mode: "create"; onCancel: () => void }
  | { mode: "edit"; trigger: Trigger; onCancel: () => void; onSaved: (trigger: Trigger) => void };

export default function TriggerForm(props: Props) {
  const editing = props.mode === "edit" ? props.trigger : null;
  const [watch, setWatch] = useState(editing?.watch ?? "");
  const [campaignId, setCampaignId] = useState<string>(editing?.campaignId ?? "");
  const [campaigns, setCampaigns] = useState<CampaignSummary[] | null>(null);
  const [campaignsFailed, setCampaignsFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [watchError, setWatchError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [example] = useState(pickExample);

  useEffect(() => {
    let current = true;
    listCampaigns()
      .then((rows) => {
        if (current) setCampaigns(rows);
      })
      .catch(() => {
        if (current) {
          setCampaigns([]);
          setCampaignsFailed(true);
        }
      });
    return () => {
      current = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setWatchError(null);
    setSaveError(null);
    const cleanWatch = watch.trim().replace(/\s+/g, " ");
    if (!cleanWatch) {
      setWatchError("Say what to watch.");
      return;
    }
    setSaving(true);
    try {
      if (props.mode === "edit") {
        /* Only what changed: an unchanged sentence sent back would rebuild
           the trigger for nothing. */
        const chosen = campaignId || null;
        props.onSaved(await updateTrigger(props.trigger.id, {
          ...(cleanWatch === (props.trigger.watch ?? "").trim() ? {} : { watch: cleanWatch }),
          ...(chosen === props.trigger.campaignId ? {} : { campaignId: chosen }),
        }));
        return;
      }
      const trigger = await createTrigger({ watch: cleanWatch, campaignId: campaignId || null });
      /* Navigation is a full page load, so the detail page raises the
         "Trigger created" toast itself off this flag. */
      window.location.href = withMockMode(`/dashboard/triggers/${encodeURIComponent(trigger.id)}?created=1`);
    } catch (reason) {
      setSaveError(
        reason instanceof Error && reason.message
          ? reason.message
          : editing ? "Could not save the changes. Try again." : "Could not create the trigger. Try again.",
      );
      setSaving(false);
    }
  }

  return (
    <>
      <header className="audience-heading">
        <div className="trigger-title-row"><h1 id="triggers-heading">{editing ? "Edit trigger" : "New trigger"}</h1></div>
      </header>

      <form className="trigger-form" onSubmit={handleSubmit} noValidate>
        <div className="trigger-form-body">
          <div className="trigger-field">
            <label className="trigger-label" htmlFor="trigger-watch">What should your agent watch?</label>
            <textarea
              className="trigger-input trigger-textarea"
              id="trigger-watch"
              rows={3}
              value={watch}
              onChange={(event) => setWatch(event.target.value)}
              placeholder={example}
              aria-invalid={watchError ? true : undefined}
              aria-describedby={watchError ? "trigger-watch-error" : undefined}
              data-testid="trigger-watch"
            />
            {watchError && <p className="trigger-field-error" id="trigger-watch-error" role="alert">{watchError}</p>}
          </div>

          <div className="trigger-field">
            <label className="trigger-label" htmlFor="trigger-campaign">Campaign (optional)</label>
            <select
              className="trigger-select"
              id="trigger-campaign"
              value={campaignId}
              onChange={(event) => setCampaignId(event.target.value)}
              disabled={campaigns === null}
            >
              <option value="">No campaign</option>
              {(campaigns ?? []).map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
              {editing?.campaignId && campaigns && !campaigns.some((campaign) => campaign.id === editing.campaignId) && (
                <option value={editing.campaignId}>{editing.campaignName ?? "Current campaign"}</option>
              )}
            </select>
            {campaignsFailed && <p className="trigger-hint" role="status">Campaigns did not load. Add one later.</p>}
          </div>
        </div>

        {saveError && (
          <div className="campaign-inline-error trigger-form-error" role="alert">
            <span>{saveError}</span>
            <button type="button" onClick={() => setSaveError(null)}>Dismiss</button>
          </div>
        )}

        <div className="trigger-form-actions">
          <button className="audience-primary" type="submit" disabled={saving} data-testid={editing ? "save-trigger" : "create-trigger"}>
            {saving ? (editing ? "Saving…" : "Creating…") : editing ? "Save" : "Create"}
          </button>
          <button className="campaign-quiet-button" type="button" onClick={props.onCancel} disabled={saving}>Cancel</button>
        </div>
      </form>
    </>
  );
}
