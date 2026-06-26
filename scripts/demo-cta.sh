#!/usr/bin/env bash
# Toggle the driftwood.sh "Book a demo" CTA for recording the Autosana demo.
#
#   ./scripts/demo-cta.sh break   # point the CTA at a dead cal.com slug (hard 404)
#   ./scripts/demo-cta.sh fix     # restore the real booking link
#
# Either way it commits to main and pushes; Vercel auto-deploys to driftwood.sh
# in ~1 min. Always `fix` after recording so your real booking link isn't left
# broken. (macOS sed.)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FILE="$ROOT/landing/src/components/BookDemo.tsx"
GOOD="https://cal.com/aayush-gupta-qyilz6/30min"
BAD="https://cal.com/aayush-gupta-qyilz6/30-min"   # renamed/nonexistent event → 404

case "${1:-}" in
  break) sed -i '' "s#$GOOD#$BAD#" "$FILE"; msg="demo: break book-a-demo CTA (dead cal.com slug)";;
  fix)   sed -i '' "s#$BAD#$GOOD#" "$FILE"; msg="demo: restore book-a-demo CTA";;
  *)     echo "usage: $(basename "$0") break|fix"; exit 1;;
esac

if git -C "$ROOT" diff --quiet -- "$FILE"; then
  echo "no change — CTA already in the '${1}' state"; exit 0
fi
git -C "$ROOT" add landing/src/components/BookDemo.tsx
git -C "$ROOT" commit -q -m "$msg" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
git -C "$ROOT" push -q origin main
echo "pushed: $msg"
echo "→ Vercel auto-deploys to driftwood.sh in ~1 min"
