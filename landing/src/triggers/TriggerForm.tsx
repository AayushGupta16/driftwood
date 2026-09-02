/* The trigger form, written as the sentence it creates: When something new
   appears on a site, then the agent acts. One required input (what counts
   as new) and an optional site, which left empty means the whole web;
   keywords, locations, skipped employers and the schedule fold under
   Options with their defaults in view. Used to create a trigger
   (design/triggers.html state 3) and, from the detail page, to edit one:
   the site is then read-only and only watch, locations, schedule, actions
   and campaign are open. */

import { useEffect, useState, type FormEvent } from "react";
import { createTrigger, updateTrigger } from "./api";
import ChipInput from "./ChipInput";
import {
  DEFAULT_EXCLUDE_EMPLOYER_TERMS,
  DEFAULT_FIRE_HOUR,
  deriveTriggerName,
  fireHourLabel,
  hostFromUrl,
  INTERVAL_HOUR_OPTIONS,
  isSiteUrl,
  scheduleLabel,
  withoutAllUs,
  type Trigger,
  type TriggerActions,
  type TriggerCadence,
} from "./model";
import { listCampaigns } from "../campaigns/api";
import type { CampaignSummary } from "../campaigns/model";
import { withMockMode } from "../mock-mode";

const FIRE_HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const DEFAULT_ACTIONS: TriggerActions = { addCompany: true, findContact: true, buildDemo: true, enroll: false };

type Props =
  | { mode: "create"; onCancel: () => void }
  | { mode: "edit"; trigger: Trigger; onCancel: () => void; onSaved: (trigger: Trigger) => void };

export default function TriggerForm(props: Props) {
  const editing = props.mode === "edit" ? props.trigger : null;
  const [url, setUrl] = useState(editing?.sourceUrl ?? editing?.sourceHost ?? "");
  const [watch, setWatch] = useState(editing?.watch ?? "");
  const [name, setName] = useState(editing?.name ?? "");
  const [keywords, setKeywords] = useState<string[]>(editing?.filters.keywords ?? []);
  const [locations, setLocations] = useState<string[]>(editing ? editing.filters.locations : ["All US"]);
  const [excludeTerms, setExcludeTerms] = useState<string[]>(editing ? editing.filters.excludeEmployerTerms : DEFAULT_EXCLUDE_EMPLOYER_TERMS);
  const [cadence, setCadence] = useState<TriggerCadence>(editing?.schedule.cadence ?? "daily");
  const [fireHour, setFireHour] = useState(editing?.schedule.fireHour ?? DEFAULT_FIRE_HOUR);
  const [intervalHours, setIntervalHours] = useState(editing?.schedule.intervalHours ?? 4);
  const [actions, setActions] = useState<TriggerActions>(editing?.actions ?? DEFAULT_ACTIONS);
  const [campaignId, setCampaignId] = useState<string>(editing?.campaignId ?? "");
  const [campaigns, setCampaigns] = useState<CampaignSummary[] | null>(null);
  const [campaignsFailed, setCampaignsFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [watchError, setWatchError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

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

  const host = hostFromUrl(url);
  const derivedName = watch.trim() || host ? deriveTriggerName(watch, host) : null;
  const schedule = { cadence, fireHour, intervalHours: cadence === "every_n_hours" ? intervalHours : null };

  function setAction(key: keyof TriggerActions, value: boolean) {
    setActions((prev) => ({ ...prev, [key]: value }));
  }

  /* Enroll needs a campaign: choosing one turns it on, clearing it turns
     it off, and the checkbox stays grey in between. */
  function chooseCampaign(id: string) {
    setCampaignId(id);
    setAction("enroll", Boolean(id));
  }

  /* What the closed Options disclosure says is in effect:
     "All US · Every night, 2 AM PT", plus the create-only fields. */
  function optionsSummary(): string {
    const parts = [locations.length ? locations.join(", ") : "Anywhere", scheduleLabel(schedule)];
    if (!editing) {
      if (keywords.length) parts.push(`${keywords.length.toLocaleString()} ${keywords.length === 1 ? "keyword" : "keywords"}`);
      if (excludeTerms.length) parts.push(`${excludeTerms.length.toLocaleString()} employer ${excludeTerms.length === 1 ? "type" : "types"} skipped`);
    }
    return parts.join(" · ");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setUrlError(null);
    setWatchError(null);
    setSaveError(null);
    const cleanUrl = url.trim();
    const cleanWatch = watch.trim().replace(/\s+/g, " ");
    let valid = true;
    if (!editing && cleanUrl && !isSiteUrl(cleanUrl)) {
      setUrlError("Paste the full address of the site, starting with https://, or leave it empty.");
      valid = false;
    }
    if (!cleanWatch) {
      setWatchError("Say what counts as new, in a few words.");
      valid = false;
    }
    if (!valid) return;
    setSaving(true);
    /* A cleared name on edit is left out, so the backend keeps the old one. */
    const fields = {
      name: name.trim() || (editing ? null : deriveTriggerName(cleanWatch, hostFromUrl(cleanUrl))),
      watch: cleanWatch,
      keywords,
      locations,
      excludeEmployerTerms: excludeTerms,
      cadence,
      fireHour,
      intervalHours: cadence === "every_n_hours" ? intervalHours : null,
      actions: { ...actions, enroll: actions.enroll && Boolean(campaignId) },
      campaignId: campaignId || null,
    };
    try {
      if (props.mode === "edit") {
        props.onSaved(await updateTrigger(props.trigger.id, fields));
        return;
      }
      const trigger = await createTrigger({ ...fields, sourceUrl: cleanUrl || null });
      /* Navigation is a full page load, so the detail page raises the
         "Trigger created" toast itself off this flag. */
      window.location.href = withMockMode(`/dashboard/triggers/${encodeURIComponent(trigger.id)}?created=1`);
    } catch (reason) {
      setSaveError(
        reason instanceof Error && reason.message
          ? reason.message
          : editing ? "The changes could not be saved. Try again." : "The trigger could not be created. Try again.",
      );
      setSaving(false);
    }
  }

  return (
    <>
      <header className="audience-heading">
        <div className="trigger-title-row"><h1 id="triggers-heading">{editing ? "Edit trigger" : "New trigger"}</h1></div>
      </header>
      <p className="trigger-lede">
        {editing
          ? "Change what counts as new, where to look, when to check and what happens next. The site stays the same."
          : "Say what counts as new, and paste a site if there is one. Your agent works out how to check it and does the rest."}
      </p>

      <form className="trigger-form" onSubmit={handleSubmit} noValidate>
        <div className="trigger-fieldset" role="group" aria-labelledby="trigger-when">
          <h2 className="trigger-legend" id="trigger-when">When</h2>
          <p className="trigger-help">Something new appears on a site.</p>

          <div className="trigger-field">
            <label className="trigger-label" htmlFor="trigger-url">Site to watch</label>
            <input
              className="trigger-input"
              id="trigger-url"
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder={editing ? "The whole web" : "Optional. Leave empty to watch the whole web."}
              readOnly={Boolean(editing)}
              aria-invalid={urlError ? true : undefined}
              aria-describedby={urlError ? "trigger-url-error" : "trigger-url-hint"}
              autoComplete="off"
            />
            {urlError
              ? <p className="trigger-field-error" id="trigger-url-error" role="alert">{urlError}</p>
              : (
                <p className="trigger-hint" id="trigger-url-hint">
                  {editing
                    ? editing.sourceUrl
                      ? "The site cannot be changed. Create a new trigger to watch another site."
                      : "This trigger watches the whole web. Create a new trigger to watch one site."
                    : "Any page that lists the postings. Leave it empty and your agent searches the whole web instead."}
                </p>
              )}
          </div>

          <div className="trigger-field">
            <label className="trigger-label" htmlFor="trigger-watch">What counts as new</label>
            <input
              className="trigger-input"
              id="trigger-watch"
              type="text"
              value={watch}
              onChange={(event) => setWatch(event.target.value)}
              placeholder="A new caregiver or CNA job posting from a home care agency"
              aria-invalid={watchError ? true : undefined}
              aria-describedby={watchError ? "trigger-watch-error" : undefined}
            />
            {watchError && <p className="trigger-field-error" id="trigger-watch-error" role="alert">{watchError}</p>}
          </div>

          <details className="trigger-options" open={editing ? true : undefined}>
            <summary>
              <span className="trigger-options-title">Options</span>
              <span className="trigger-options-hint">{optionsSummary()}</span>
            </summary>
            <div className="trigger-options-body">
              <div className={editing ? "trigger-field" : "trigger-input-grid"}>
                {!editing && (
                  <div>
                    <label className="trigger-label" htmlFor="trigger-keywords">Keywords</label>
                    <ChipInput id="trigger-keywords" kind="keywords" values={keywords} onChange={setKeywords} placeholder="caregiver, CNA, home health aide" describedBy="trigger-keywords-hint" />
                    <p className="trigger-hint" id="trigger-keywords-hint">Words a posting should contain. Press Enter or type a comma after each one.</p>
                  </div>
                )}
                <div>
                  <label className="trigger-label" htmlFor="trigger-locations">Locations</label>
                  <ChipInput id="trigger-locations" kind="locations" values={locations} onChange={(next) => setLocations(withoutAllUs(next))} placeholder="All US" describedBy="trigger-locations-hint" />
                  <p className="trigger-hint" id="trigger-locations-hint">Press Enter after each place, so a city can keep its state.</p>
                </div>
              </div>

              {!editing && (
                <div className="trigger-field">
                  <label className="trigger-label" htmlFor="trigger-exclude">Skip employers whose name contains</label>
                  <ChipInput id="trigger-exclude" kind="terms" values={excludeTerms} onChange={setExcludeTerms} placeholder="senior living, hospital" describedBy="trigger-exclude-hint" />
                  <p className="trigger-hint" id="trigger-exclude-hint">Postings from these employers are skipped. Remove a chip to keep them.</p>
                </div>
              )}

              <div className="trigger-field">
                <p className="trigger-label" id="trigger-schedule">Schedule</p>
                <div className="trigger-cadence-row">
                  <div className="trigger-seg" role="radiogroup" aria-labelledby="trigger-schedule">
                    <label className={cadence === "daily" ? "is-selected" : ""}>
                      <input type="radio" name="cadence" value="daily" checked={cadence === "daily"} onChange={() => setCadence("daily")} />
                      Daily
                    </label>
                    <label className={cadence === "weekly" ? "is-selected" : ""}>
                      <input type="radio" name="cadence" value="weekly" checked={cadence === "weekly"} onChange={() => setCadence("weekly")} />
                      Weekly
                    </label>
                    <label className={cadence === "every_n_hours" ? "is-selected" : ""}>
                      <input type="radio" name="cadence" value="every_n_hours" checked={cadence === "every_n_hours"} onChange={() => setCadence("every_n_hours")} />
                      Every N hours
                    </label>
                  </div>
                  {cadence === "every_n_hours" ? (
                    <select className="trigger-select" value={intervalHours} onChange={(event) => setIntervalHours(Number(event.target.value))} aria-label="Hours between checks">
                      {INTERVAL_HOUR_OPTIONS.map((hours) => <option key={hours} value={hours}>Every {hours} hours</option>)}
                    </select>
                  ) : (
                    <select className="trigger-select" value={fireHour} onChange={(event) => setFireHour(Number(event.target.value))} aria-label="Hour, Pacific time">
                      {FIRE_HOURS.map((hour) => <option key={hour} value={hour}>{fireHourLabel(hour)} PT</option>)}
                    </select>
                  )}
                </div>
                <p className="trigger-hint">Checks run on their own, in Pacific time. Nightly leaves the night for building demos, so the Review queue is ready in the morning.</p>
              </div>
            </div>
          </details>
        </div>

        <div className="trigger-fieldset" role="group" aria-labelledby="trigger-then">
          <h2 className="trigger-legend" id="trigger-then">Then</h2>
          <p className="trigger-help">What your agent does with each new posting.</p>
          <div className="trigger-checks">
            <label className="trigger-check">
              <input type="checkbox" checked={actions.addCompany} onChange={(event) => setAction("addCompany", event.target.checked)} />
              <strong>Add the agency as a company</strong>
              <small>It appears in Companies with the posting attached.</small>
            </label>
            <label className="trigger-check">
              <input type="checkbox" checked={actions.findContact} onChange={(event) => setAction("findContact", event.target.checked)} />
              <strong>Find the owner or administrator</strong>
              <small>Looks up a decision maker and adds them as a lead.</small>
            </label>
            <label className="trigger-check">
              <input type="checkbox" checked={actions.buildDemo} onChange={(event) => setAction("buildDemo", event.target.checked)} />
              <strong>Build a personalized demo</strong>
              <small>Your product, filled with their own posting.</small>
            </label>
            <div className={`trigger-check${campaignId ? "" : " is-disabled"}`}>
              <input
                type="checkbox"
                id="trigger-enroll"
                checked={actions.enroll && Boolean(campaignId)}
                disabled={!campaignId}
                title={campaignId ? undefined : "Choose a campaign to turn this on"}
                onChange={(event) => setAction("enroll", event.target.checked)}
              />
              <label htmlFor="trigger-enroll"><strong>Enroll in campaign</strong></label>
              <small>{campaignId ? "Queues the campaign's messages for that contact." : "Choose a campaign to turn this on."}</small>
              <select
                className="trigger-select"
                value={campaignId}
                onChange={(event) => chooseCampaign(event.target.value)}
                aria-label="Campaign"
                disabled={campaigns === null}
              >
                <option value="">{campaigns === null ? "Loading campaigns…" : "No campaign"}</option>
                {(campaigns ?? []).map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
                {editing?.campaignId && campaigns && !campaigns.some((campaign) => campaign.id === editing.campaignId) && (
                  <option value={editing.campaignId}>{editing.campaignName ?? "Current campaign"}</option>
                )}
              </select>
              {campaignsFailed && <small role="status">Campaigns could not load. You can pick one after the trigger exists.</small>}
            </div>
          </div>
          <p className="trigger-fixed">Every message waits in your Review queue. Nothing goes out on its own.</p>
        </div>

        <div className="trigger-fieldset" role="group" aria-labelledby="trigger-name-legend">
          <h2 className="trigger-legend" id="trigger-name-legend">Name</h2>
          <p className="trigger-help">Optional. Without one, the trigger is named after the site, or after the first words of what counts as new.</p>
          <label className="audience-visually-hidden" htmlFor="trigger-name">Name</label>
          <input
            className="trigger-input"
            id="trigger-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={derivedName ?? "Named after the site or the sentence"}
            autoComplete="off"
          />
        </div>

        {saveError && (
          <div className="campaign-inline-error trigger-form-error" role="alert">
            <span>{saveError}</span>
            <button type="button" onClick={() => setSaveError(null)}>Dismiss</button>
          </div>
        )}

        <div className="trigger-form-actions">
          <button className="audience-primary" type="submit" disabled={saving} data-testid={editing ? "save-trigger" : "create-trigger"}>
            {saving ? (editing ? "Saving…" : "Creating…") : editing ? "Save changes" : "Create trigger"}
          </button>
          <button className="campaign-quiet-button" type="button" onClick={props.onCancel} disabled={saving}>Cancel</button>
        </div>
      </form>
    </>
  );
}
