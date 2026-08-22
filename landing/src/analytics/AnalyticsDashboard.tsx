import { useCallback, useEffect, useMemo, useState } from "react";
import { getChannelAnalytics } from "./api";
import { InfoIcon, RefreshIcon, TrendIcon } from "./icons";
import {
  AVAILABLE_STATUSES,
  CHANNELS,
  analyticsDataAfterFailure,
  appendAnalyticsPage,
  analyticsWindow,
  channelLabel,
  formatMetric,
  formatObservedAt,
  statusLabel,
  type AnalyticsChannel,
  type AnalyticsStatus,
  type ChannelAnalytics,
  type MetricValue,
} from "./model";
import "./analytics.css";

const WINDOWS = [
  { days: 7, label: "Last 7 days" },
  { days: 30, label: "Last 30 days" },
  { days: 90, label: "Last 90 days" },
];

const METRIC_KEYS = [
  { key: "contacted", label: "Contacted" },
  { key: "opened", label: "Opened" },
  { key: "clicked", label: "Clicked" },
  { key: "replied", label: "Replied" },
  { key: "demosBooked", label: "Demos booked" },
] as const;

function MetricCell({ metric, unavailable }: { metric: MetricValue; unavailable: string }) {
  return (
    <td className={!metric.available ? "analytics-unavailable" : undefined}>
      <span title={!metric.available ? unavailable : undefined}>{formatMetric(metric)}</span>
    </td>
  );
}

export default function AnalyticsDashboard() {
  const [days, setDays] = useState(30);
  const [channel, setChannel] = useState<AnalyticsChannel | null>(null);
  const [status, setStatus] = useState<AnalyticsStatus>("replied");
  const [data, setData] = useState<ChannelAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    setLoadingMore(false);
    setData(null);
    setOffset(0);
    setError(null);
    setRefreshKey((value) => value + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const window = analyticsWindow(days);
    getChannelAnalytics({
      ...window,
      channel,
      status,
      limit: 100,
      offset,
      signal: controller.signal,
    })
      .then((next) => {
        setData((current) => offset > 0 && current
          ? appendAnalyticsPage(current, next)
          : next);
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setData((current) => analyticsDataAfterFailure(current, offset));
        setError(reason instanceof Error ? reason.message : "Analytics could not load.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
          setLoadingMore(false);
        }
      });
    return () => controller.abort();
  }, [channel, days, offset, refreshKey, status]);

  const unavailable = useMemo(
    () =>
      data?.definitions.find((definition) => definition.id === "opened")?.note ??
      "This event is not tracked yet.",
    [data],
  );
  const dataIssues = data
    ? Object.values(data.unmatchedReplies).reduce((sum, value) => sum + value, 0) +
      data.unattributedDemosBooked
    : 0;

  return (
    <section className="analytics-page" aria-labelledby="analytics-heading">
      <div className="analytics-heading-row">
        <h1 id="analytics-heading">Channel performance</h1>
        <div className="analytics-window-controls">
          <label>
            <span>Date range</span>
            <select
              value={days}
              onChange={(event) => {
                setLoading(true);
                setData(null);
                setError(null);
                setOffset(0);
                setDays(Number(event.target.value));
              }}
            >
              {WINDOWS.map((option) => (
                <option key={option.days} value={option.days}>{option.label}</option>
              ))}
            </select>
          </label>
          <button type="button" className="analytics-refresh" onClick={load} disabled={loading}>
            <RefreshIcon />
            <span>{loading ? "Refreshing…" : "Refresh"}</span>
          </button>
        </div>
      </div>

      {error ? (
        <div className="analytics-error" role="alert">
          <div>
            <strong>Channel data is unavailable</strong>
            <p>{error}</p>
          </div>
          <button type="button" onClick={load}>Try again</button>
        </div>
      ) : null}

      <section className="analytics-matrix-section" aria-labelledby="channel-matrix-heading">
        <div className="analytics-section-heading">
          <h2 id="channel-matrix-heading">Funnel by channel</h2>
        </div>
        <div className="analytics-table-scroll">
          <table className="analytics-matrix">
            <thead>
              <tr>
                <th scope="col">Channel</th>
                {METRIC_KEYS.map((metric) => <th key={metric.key} scope="col">{metric.label}</th>)}
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && !data ? (
                CHANNELS.map((rowChannel) => (
                  <tr key={rowChannel} className="analytics-skeleton-row">
                    <th scope="row"><span /></th>
                    {METRIC_KEYS.map((metric) => <td key={metric.key}><span /></td>)}
                  </tr>
                ))
              ) : (
                data?.channels.map((row) => (
                  <tr key={row.channel}>
                    <th scope="row"><span className={`analytics-channel-dot is-${row.channel}`} />{channelLabel(row.channel)}</th>
                    <MetricCell metric={row.contacted} unavailable={unavailable} />
                    <MetricCell metric={row.opened} unavailable={unavailable} />
                    <MetricCell metric={row.clicked} unavailable={unavailable} />
                    <MetricCell metric={row.replied} unavailable={unavailable} />
                    <MetricCell metric={row.demosBooked} unavailable={unavailable} />
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="analytics-people-section" aria-labelledby="outcome-detail-heading">
        <div className="analytics-section-heading analytics-detail-heading">
          <h2 id="outcome-detail-heading">Outcome detail</h2>
          <div className="analytics-filter-row">
            <label>
              <span className="sr-only">Filter people by channel</span>
              <select
                value={channel ?? "all"}
                onChange={(event) => {
                  setLoading(true);
                  setData(null);
                  setError(null);
                  setOffset(0);
                  setChannel(
                    event.target.value === "all"
                      ? null
                      : event.target.value as AnalyticsChannel,
                  );
                }}
              >
                <option value="all">All channels</option>
                {CHANNELS.map((option) => <option key={option} value={option}>{channelLabel(option)}</option>)}
              </select>
            </label>
          </div>
        </div>
        <div className="analytics-status-tabs" role="tablist" aria-label="Outcome type">
          {AVAILABLE_STATUSES.map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={status === option}
              className={status === option ? "is-active" : ""}
              onClick={() => {
                if (status === option) return;
                setLoading(true);
                setData(null);
                setError(null);
                setOffset(0);
                setStatus(option);
              }}
            >
              {statusLabel(option)}
            </button>
          ))}
          <span className="analytics-status-unavailable" title={unavailable}>Opened and clicked unavailable</span>
        </div>

        <div className="analytics-table-scroll">
          <table className="analytics-people-table">
            <thead>
              <tr>
                <th scope="col">Person</th>
                <th scope="col">Company</th>
                <th scope="col">Channel</th>
                <th scope="col">Observed</th>
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {data?.people.map((person, index) => (
                <tr key={`${person.leadId ?? "unmatched"}-${person.channel}-${index}`}>
                  <td>
                    <strong>{person.name ?? "Removed lead"}</strong>
                    <span>{person.title ?? person.email ?? "Details unavailable"}</span>
                  </td>
                  <td>{person.companyName ?? "—"}</td>
                  <td><span className={`analytics-channel-tag is-${person.channel ?? "unknown"}`}>{channelLabel(person.channel)}</span></td>
                  <td>{formatObservedAt(person.occurredAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && data && data.people.length === 0 ? (
          <div className="analytics-empty">
            <TrendIcon size={22} />
            <strong>No {statusLabel(status).toLowerCase()} prospects in this view</strong>
            <p>Try a broader date range or another channel.</p>
          </div>
        ) : null}

        <div className="analytics-table-footer">
          <span>
            {data
              ? `Showing ${data.people.length} of ${data.peopleTotal} ${data.peopleTotal === 1 ? "person" : "people"}`
              : error
                ? "People unavailable for this view"
              : "Loading people…"}
          </span>
          {dataIssues > 0 ? (
            <span title="Unmatched replies and bookings without a prior send are not assigned to a channel.">
              {dataIssues} signals need attribution
            </span>
          ) : (
            <span>All observed outcomes attributed</span>
          )}
        </div>
        {data && data.people.length < data.peopleTotal ? (
          <button
            className="analytics-load-more"
            type="button"
            onClick={() => {
              setLoadingMore(true);
              setOffset(data.offset + data.limit);
            }}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading more…" : `Load more people · ${data.peopleTotal - data.people.length} remaining`}
          </button>
        ) : null}
      </section>

      <aside className="analytics-method" aria-label="Metric definitions">
        <InfoIcon />
        <p>Open and click tracking isn&rsquo;t available yet.</p>
      </aside>
    </section>
  );
}
