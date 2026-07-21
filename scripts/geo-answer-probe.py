#!/usr/bin/env python3
"""GEO Layer 2: answer-share probe.

Layer 1 (backend probe + /geo-probe skill) checks whether driftwood.sh
appears in WEB-SEARCH results for the fixed query set. This script is
Layer 2: it asks real AI answer engines the ACTUAL queries (the user
message is the query verbatim, nothing else) and grades whether
driftwood is NAMED in the answer text. Answer-share is the truth
metric; the search probe is only the leading indicator.

Engines (all via one OpenRouter key; ``:online`` = OpenRouter web
search plugin):
  sonar   perplexity/sonar                 (a real answer engine)
  gpt     openai/gpt-5-mini:online         (openai gpt + web access)
  gemini  google/gemini-3.5-flash:online   (same family as the Layer 1
                                            backend probe)
Override with GEO_ANSWER_MODELS="sonar=perplexity/sonar,gpt=...".

Grading per answer (deterministic text scan, snippet stored for
audit): "driftwood.sh" or a bare "driftwood" in tight AI-SDR/
sales-tool context = named_us — UNLESS the mention sits next to
uncertainty vocab ("can't confirm", "don't see a result", ...), which
is the engine echoing the query without knowing us -> ambiguous. The
bare word also matches driftwood.ai (research org) and
driftwood-ai.com (consultancy) -> named_collision; a mention that is
neither (literal wood, the Steam game, unclear) = ambiguous; no
mention = absent. Sales context must sit in the SAME SENTENCE as the
mention — verified against live answers 2026-07-21: engines echo
branded queries back with disclaimers, and "Driftwood AI" the
collision entity shows up one sentence away from unrelated SDR talk —
both graded down. Competitor watch-list (GEO.md) presence is also
recorded. Every row carries id/tier/query/engine/model/verdict/
competitors/500-char excerpt/cost.

Outputs in site/geo-results/ (date = system clock at run time):
  answers-YYYY-MM-DD-<engine>.json   per-engine full results
  answers-latest.json                cross-engine summary; headline =
                                     tier-1 named_us rate per engine
  answers-YYYY-MM-DD.md              human summary
RESULTS ARE COMPARABLE ONLY WITHIN ONE ENGINE+MODEL LINE - every file
stamps engine+model; never mix lines.

Cost: hard stop at $15/run - aborts up front if the estimate exceeds
it and mid-run if actual accumulated cost (OpenRouter usage
accounting) exceeds it. A 402 (out of credits) aborts immediately.
Retries on 429/5xx/network; per-query errors are recorded and count
as absent (>20% errors marks the engine run "partial", same
convention as Layer 1; 100% errors marks it "failed" and its line
carries the error, never partial data presented as complete).

Usage:
  python3 site/scripts/geo-answer-probe.py             # full run
  python3 site/scripts/geo-answer-probe.py --dry-run   # estimate only
  python3 site/scripts/geo-answer-probe.py --engines sonar --limit 3
Key: OPENROUTER_API_KEY env var, else backend/.env.
"""

import argparse
import json
import os
import random
import re
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from pathlib import Path

import requests

# ---------------------------------------------------------------- config

# engine short name -> OpenRouter model id. Overridable via
# GEO_ANSWER_MODELS="name=model,name=model". Engine names are used in
# result filenames; comparisons are only valid within one engine+model.
ENGINES = {
    "sonar": "perplexity/sonar",
    "gpt": "openai/gpt-5-mini:online",
    "gemini": "google/gemini-3.5-flash:online",
}

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
CONCURRENCY = 6
MAX_TOKENS = 2500  # bounds cost; reasoning + long listicles fit
TIMEOUT = 180  # seconds per request; web-search answers can be slow
RETRIES = 4  # attempts per query on 429/5xx/network errors
HARD_COST_STOP = 15.0  # USD; abort the run past this, estimated or actual
SNIPPET_LEN = 500  # chars of answer head stored for audit

# Rough per-query USD for the pre-run estimate (tokens + web/search
# fee; measured live 2026-07-21). Unknown models fall back to the
# most expensive known figure.
EST_COST_PER_QUERY = {
    "perplexity/sonar": 0.010,
    "openai/gpt-5-mini:online": 0.008,
    "google/gemini-3.5-flash:online": 0.050,
}
EST_FALLBACK = 0.050

# Per-model request extras, matched by substring of the model id.
# gemini's native grounding at default reasoning fires ~7 searches
# per query (~$0.21/query -> ~$21/run, past the hard stop); low
# effort drops it to ~2 searches (~$0.05/query) with answers intact
# (measured live 2026-07-21).
EXTRA_BODY = {"gemini": {"reasoning": {"effort": "low"}}}

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
QUERYSET = REPO_ROOT / "site" / "geo-results" / "queryset-v2.json"
RESULTS_DIR = REPO_ROOT / "site" / "geo-results"
BACKEND_ENV = REPO_ROOT / "backend" / ".env"

# The GEO competitor watch-list (GEO.md / backend probes.py). Names
# that are ordinary English words are matched case-sensitively to cut
# false positives; distinctive names match case-insensitively.
COMPETITORS_EXACT = ["Instantly", "Artisan", "Apollo", "Clay", "Unify", "Nooks"]
COMPETITORS_ANYCASE = [
    "11x",
    "Autobound",
    "Amplemarket",
    "Smartlead",
    "AiSDR",
    "Landbase",
    "Coldreach",
    "Lemlist",
    "Salesforge",
    "Saleshandy",
]
COMPETITORS = COMPETITORS_EXACT + COMPETITORS_ANYCASE

# Context vocab for classifying a bare "driftwood" mention. Collision
# vocab is checked FIRST: both collision entities live in AI-adjacent
# text, so research/consulting words outrank sales words. Sales words
# must sit TIGHT against the mention (answers discuss other SDR tools
# a sentence away from a collision-entity mention — verified live).
SALES_CONTEXT = [
    "sdr",
    "bdr",
    "outbound",
    "cold email",
    "cold outreach",
    "sales",
    "prospect",
    "demo-led",
    "lead generation",
    "pipeline",
    "outreach",
]
# "test ideas" / "build ai products" = driftwood.ai's live self-
# description (observed verbatim in 2026-07-21 sonar answers).
COLLISION_CONTEXT = [
    "research",
    "consultanc",
    "consulting",
    "advisory",
    "test ideas",
    "build ai products",
    "real outcomes",  # driftwood.ai tagline "Real AI. Real outcomes."
]
# An engine echoing the query token while admitting it doesn't know
# the entity is NOT naming us (verified: sonar echoes "driftwood.sh"
# inside "I don't see a result for..." on the branded query).
UNCERTAIN_CONTEXT = [
    "can't confirm",
    "cannot confirm",
    "couldn't find",
    "could not find",
    "can't find",
    "cannot find",
    "don't see",
    "do not see",
    "don't have",
    "do not have",
    "no result",
    "no information",
    "not familiar",
    "unclear",
    "ambiguous",
    "not sure",
    "unable to",
    "does not appear",
    "doesn't appear",
    "no specific",
    "not aware",
    "you mean",  # "if (by X) you mean", "do/did you mean" — query echoes
    "tell me which",
]
CONTEXT_WINDOW = 300  # chars each side of a mention (collision/uncertainty)
SALES_WINDOW = 120  # chars each side for the tight sales-context test

VERDICTS = ["named_us", "named_collision", "ambiguous", "absent"]

# ------------------------------------------------------------- utilities


def load_api_key():
    key = os.getenv("OPENROUTER_API_KEY", "")
    if key:
        return key
    if BACKEND_ENV.exists():
        for line in BACKEND_ENV.read_text().splitlines():
            if line.startswith("OPENROUTER_API_KEY="):
                return line.split("=", 1)[1].strip()
    sys.exit("no OPENROUTER_API_KEY in env or backend/.env")


def load_engines():
    raw = os.getenv("GEO_ANSWER_MODELS", "")
    if not raw:
        return dict(ENGINES)
    engines = {}
    for pair in raw.split(","):
        name, _, model = pair.partition("=")
        if not name.strip() or not model.strip():
            sys.exit(f"bad GEO_ANSWER_MODELS entry {pair!r} (want name=model)")
        engines[name.strip()] = model.strip()
    return engines


def grade_answer(text):
    """(verdict, mention_snippet) for one answer text.

    Deterministic scan; the snippet around the first mention (plus the
    stored answer head) is the audit trail for the verdict. Biased
    against false named_us: zero is the honest baseline, and audit of
    live answers showed engines echo branded queries with disclaimers.
    """
    lower = text.lower().replace("’", "'")
    mentions = list(re.finditer(r"\bdriftwood\b", lower))
    if not mentions:
        return "absent", None

    # An answer that OPENS with a clarifying question ("Do you mean
    # one of these? 1) ... 4) SDR outreach for Driftwood AI") is
    # enumerating guesses, not naming us — mentions anywhere in it
    # inherit the uncertainty (verified live on gpt-5-mini 2026-07-21).
    head_uncertain = any(w in lower[:300] for w in UNCERTAIN_CONTEXT)

    first = mentions[0]
    snip_start = max(0, first.start() - 150)
    snippet = text[snip_start : first.end() + 350]

    per_mention = []
    for m in mentions:
        tail = lower[m.end() : m.end() + 8]
        window = lower[max(0, m.start() - CONTEXT_WINDOW) : m.end() + CONTEXT_WINDOW]
        uncertain = head_uncertain or any(w in window for w in UNCERTAIN_CONTEXT)
        if tail.startswith(".sh"):
            # our domain, unless the engine is just echoing the query
            # while saying it doesn't know the site
            per_mention.append("ambiguous" if uncertain else "named_us")
            continue
        if tail.startswith(".ai") or tail.startswith("-ai"):
            per_mention.append("named_collision")
            continue
        if any(w in window for w in COLLISION_CONTEXT):
            per_mention.append("named_collision")
            continue
        # Sales context must sit in the SAME SENTENCE as the mention:
        # collision-entity mentions live one sentence away from generic
        # SDR talk (verified live 2026-07-21). Boundary = ./!/? followed
        # by whitespace, so domains (driftwood.sh) don't split.
        sent_start, sent_end = 0, len(lower)
        for b in re.finditer(r"[.!?](?=\s|$)", lower):
            if b.start() < m.start():
                sent_start = b.end()
            elif b.start() >= m.end():
                sent_end = b.start()
                break
        tight = lower[
            max(sent_start, m.start() - SALES_WINDOW) : min(
                sent_end, m.end() + SALES_WINDOW
            )
        ]
        if not uncertain and any(w in tight for w in SALES_CONTEXT):
            per_mention.append("named_us")
        else:
            per_mention.append("ambiguous")

    for verdict in ("named_us", "named_collision", "ambiguous"):
        if verdict in per_mention:
            return verdict, snippet
    return "ambiguous", snippet


def find_competitors(text):
    found = []
    for name in COMPETITORS_EXACT:
        if re.search(rf"\b{re.escape(name)}\b", text):
            found.append(name)
    for name in COMPETITORS_ANYCASE:
        if re.search(rf"\b{re.escape(name)}\b", text, re.IGNORECASE):
            found.append(name)
    return found


class RunAborted(Exception):
    pass


class CostMeter:
    """Thread-safe actual-cost accumulator with the hard stop."""

    def __init__(self, limit):
        self.limit = limit
        self.total = 0.0
        self._lock = threading.Lock()
        self.tripped = False
        self.reason = None

    def add(self, cost):
        with self._lock:
            self.total += cost
            if self.total > self.limit and not self.tripped:
                self.tripped = True
                self.reason = (
                    f"hard cost stop: actual spend ${self.total:.2f} > ${self.limit}"
                )

    def trip(self, reason):
        """Kill the run for a non-cost reason (402) so queued workers
        abort instantly instead of each firing a doomed request."""
        with self._lock:
            if not self.tripped:
                self.tripped = True
                self.reason = reason

    def check(self):
        if self.tripped:
            raise RunAborted(self.reason)


def ask_engine(session, api_key, model, query, meter):
    """One answer-engine call: the query verbatim as the user message.

    Returns (answer_text, cost_usd). Raises RunAborted on 402 or the
    cost stop; other repeated failures raise the last error.
    """
    body = {
        "model": model,
        "messages": [{"role": "user", "content": query}],
        "max_tokens": MAX_TOKENS,
        "usage": {"include": True},
    }
    for fragment, extra in EXTRA_BODY.items():
        if fragment in model:
            body.update(extra)
    headers = {
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": "https://driftwood.sh",
        "X-Title": "Driftwood",
    }
    last_error = None
    for attempt in range(1, RETRIES + 1):
        meter.check()
        try:
            resp = session.post(
                OPENROUTER_URL, json=body, headers=headers, timeout=TIMEOUT
            )
            if resp.status_code == 402:
                meter.trip("OpenRouter 402: key out of credits")
                raise RunAborted("OpenRouter 402: key out of credits")
            if resp.status_code == 429 or resp.status_code >= 500:
                raise requests.HTTPError(f"HTTP {resp.status_code}: {resp.text[:200]}")
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"] or ""
            cost = float((data.get("usage") or {}).get("cost") or 0.0)
            meter.add(cost)
            return content, cost
        except RunAborted:
            raise
        except Exception as exc:  # 429/5xx/network/parse -> retry
            last_error = exc
            if attempt < RETRIES:
                time.sleep(2 * attempt + random.random())
    raise last_error


def probe_query(session, api_key, engine, model, entry, meter):
    """One query -> one graded result row (errors recorded, not raised)."""
    row = {
        "n": entry["n"],
        "tier": entry["tier"],
        "q": entry["q"],
        "engine": engine,
        "model": model,
        "verdict": "absent",
        "competitors": [],
        "answer_head": None,
        "mention_snippet": None,
        "cost_usd": 0.0,
    }
    try:
        answer, cost = ask_engine(session, api_key, model, entry["q"], meter)
    except RunAborted:
        raise
    except Exception as exc:
        row["error"] = str(exc)[:300]
        return row
    verdict, snippet = grade_answer(answer)
    row["verdict"] = verdict
    row["competitors"] = find_competitors(answer)
    row["answer_head"] = answer[:SNIPPET_LEN]
    row["mention_snippet"] = snippet
    row["cost_usd"] = round(cost, 6)
    return row


# ------------------------------------------------------------- summaries


def tier_stats(rows):
    """Per-tier verdict counts + named_us rate, tiers as sorted strings."""
    out = {}
    for tier in sorted({r["tier"] for r in rows}):
        tier_rows = [r for r in rows if r["tier"] == tier]
        counts = {v: sum(1 for r in tier_rows if r["verdict"] == v) for v in VERDICTS}
        counts["total"] = len(tier_rows)
        counts["named_us_rate"] = (
            round(counts["named_us"] / len(tier_rows), 4) if tier_rows else 0.0
        )
        out[str(tier)] = counts
    return out


def competitor_counts(rows):
    counts = {}
    for row in rows:
        for name in row["competitors"]:
            counts[name] = counts.get(name, 0) + 1
    return dict(sorted(counts.items(), key=lambda kv: -kv[1]))


def engine_summary(engine, model, rows, cost):
    errors = sum(1 for r in rows if "error" in r)
    if rows and errors == len(rows):
        status = "failed"  # zero data - never present this as a baseline
    elif rows and errors / len(rows) > 0.2:
        status = "partial"
    else:
        status = "completed"
    tiers = tier_stats(rows)
    tier1 = tiers.get("1", {})
    return {
        "engine": engine,
        "model": model,
        "status": status,
        "errors": errors,
        "error_sample": next((r["error"] for r in rows if "error" in r), None),
        "total": len(rows),
        "named_us_total": sum(1 for r in rows if r["verdict"] == "named_us"),
        "tier1_named_us": tier1.get("named_us", 0),
        "tier1_total": tier1.get("total", 0),
        "tier1_named_us_rate": tier1.get("named_us_rate", 0.0),
        "per_tier": tiers,
        "competitor_counts": competitor_counts(rows),
        "cost_usd": round(cost, 4),
    }


def write_markdown(path, run_date, queryset_version, summaries, total_cost):
    lines = [
        f"# GEO answer probe (Layer 2) {run_date} (set {queryset_version})",
        "",
        "Asked real AI answer engines the 100 fixed queries verbatim;",
        "graded whether driftwood is NAMED in the answer text.",
        "Headline = tier-1 named_us rate. Results comparable only within",
        "one engine+model line.",
        "",
    ]
    for s in summaries:
        if s["status"] == "failed":
            lines.append(
                f"- {s['engine']} ({s['model']}): FAILED - all {s['total']} "
                f"queries errored, no data. First error: {s['error_sample']}"
            )
            continue
        t1 = s["per_tier"].get("1", {})
        lines.append(
            f"- {s['engine']} ({s['model']}): tier-1 named_us "
            f"{s['tier1_named_us']}/{s['tier1_total']}, total named_us "
            f"{s['named_us_total']}/{s['total']}, collision "
            f"{sum(c['named_collision'] for c in s['per_tier'].values())}, "
            f"ambiguous {sum(c['ambiguous'] for c in s['per_tier'].values())}, "
            f"errors {s['errors']} ({s['status']}); tier-1 collision "
            f"{t1.get('named_collision', 0)}, cost ${s['cost_usd']:.2f}"
        )
    lines.append("")
    lines.append("Competitor mentions (answers naming them, per engine):")
    for s in summaries:
        top = ", ".join(
            f"{name} {count}" for name, count in list(s["competitor_counts"].items())[:8]
        )
        lines.append(f"- {s['engine']}: {top or 'none'}")
    lines.append("")
    lines.append(f"Run cost: ${total_cost:.2f}. Full rows in answers-{run_date}-*.json.")
    lines.append("")
    path.write_text("\n".join(lines))


# ------------------------------------------------------------------ main


def main():
    parser = argparse.ArgumentParser(description="GEO Layer 2 answer probe")
    parser.add_argument(
        "--engines", help="comma-separated engine subset (default: all)"
    )
    parser.add_argument(
        "--limit", type=int, help="only the first N queries (smoke test)"
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="print the cost estimate and exit"
    )
    args = parser.parse_args()

    engines = load_engines()
    if args.engines:
        wanted = [e.strip() for e in args.engines.split(",")]
        unknown = [e for e in wanted if e not in engines]
        if unknown:
            sys.exit(f"unknown engines {unknown}; have {sorted(engines)}")
        engines = {name: engines[name] for name in wanted}

    queryset = json.loads(QUERYSET.read_text())
    queries = queryset["queries"]
    if args.limit:
        queries = queries[: args.limit]

    estimate = sum(
        EST_COST_PER_QUERY.get(model, EST_FALLBACK) * len(queries)
        for model in engines.values()
    )
    print(
        f"{len(queries)} queries x {len(engines)} engines "
        f"({', '.join(f'{n}={m}' for n, m in engines.items())}); "
        f"estimated cost ${estimate:.2f}, hard stop ${HARD_COST_STOP}"
    )
    if estimate > HARD_COST_STOP:
        sys.exit(f"estimated cost ${estimate:.2f} exceeds ${HARD_COST_STOP}; aborting")
    if args.dry_run:
        return

    api_key = load_api_key()
    run_date = date.today().isoformat()
    meter = CostMeter(HARD_COST_STOP)
    summaries = []

    # Engines run sequentially so an abort still leaves whole engine
    # files; queries fan out CONCURRENCY-wide within an engine. An
    # abort (402 / cost stop) drops the in-flight engine's rows but
    # still writes latest + md for engines that finished whole.
    aborted = None
    for engine, model in engines.items():
        print(f"[{engine}] {model}: {len(queries)} queries ...")
        started = time.time()
        cost_before = meter.total
        session = requests.Session()
        try:
            with ThreadPoolExecutor(max_workers=CONCURRENCY) as pool:
                rows = list(
                    pool.map(
                        lambda entry: probe_query(
                            session, api_key, engine, model, entry, meter
                        ),
                        queries,
                    )
                )
        except RunAborted as exc:
            aborted = f"aborted during [{engine}]: {exc}"
            print(aborted, file=sys.stderr)
            break
        rows.sort(key=lambda r: r["n"])
        engine_cost = meter.total - cost_before
        summary = engine_summary(engine, model, rows, engine_cost)
        summaries.append(summary)

        out = RESULTS_DIR / f"answers-{run_date}-{engine}.json"
        out.write_text(
            json.dumps(
                {
                    "date": run_date,
                    "layer": "answer",
                    "queryset_version": queryset["version"],
                    "engine": engine,
                    "model": model,
                    "summary": summary,
                    "per_query": rows,
                },
                indent=1,
            )
            + "\n"
        )
        print(
            f"[{engine}] done in {time.time() - started:.0f}s: tier-1 named_us "
            f"{summary['tier1_named_us']}/{summary['tier1_total']}, total "
            f"{summary['named_us_total']}/{summary['total']}, errors "
            f"{summary['errors']}, cost ${engine_cost:.2f} -> {out.name}"
        )

    if not summaries:
        sys.exit(f"ABORTED with no completed engines: {aborted}")

    latest = RESULTS_DIR / "answers-latest.json"
    latest.write_text(
        json.dumps(
            {
                "date": run_date,
                "layer": "answer",
                "queryset_version": queryset["version"],
                "aborted": aborted,
                "headline": {
                    s["engine"]: {
                        "model": s["model"],
                        "status": s["status"],
                        "tier1_named_us": s["tier1_named_us"],
                        "tier1_total": s["tier1_total"],
                        "tier1_named_us_rate": s["tier1_named_us_rate"],
                    }
                    for s in summaries
                },
                "engines": summaries,
                "total_cost_usd": round(meter.total, 4),
                "note": "results comparable only within one engine+model line",
            },
            indent=1,
        )
        + "\n"
    )
    write_markdown(
        RESULTS_DIR / f"answers-{run_date}.md",
        run_date,
        queryset["version"],
        summaries,
        meter.total,
    )
    print(f"total cost ${meter.total:.2f}; wrote {latest.name} + answers-{run_date}.md")
    if aborted:
        sys.exit(f"ABORTED: {aborted}")


if __name__ == "__main__":
    main()
