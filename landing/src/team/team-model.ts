/* Pure helpers behind the Team panel's auto-join domain card, split out so
   node --test can pin the save-button logic (same convention as
   sends-model.ts). */

/* What actually gets saved: trimmed, lowercased, any pasted leading "@"
   dropped. Empty input means "turn auto-join off" and saves as null. */
export function normalizeDomain(value: string): string | null {
  const cleaned = value.trim().toLowerCase().replace(/^@+/, "");
  return cleaned || null;
}

/* Save is enabled only when the draft would change the saved value — an
   untouched field (draft null) or a draft that normalizes back to what is
   already saved leaves the button disabled, with a title saying why. */
export function domainDirty(saved: string | null, draft: string | null): boolean {
  if (draft === null) return false;
  const savedNormalized = saved ? normalizeDomain(saved) : null;
  return normalizeDomain(draft) !== savedNormalized;
}
