/* The number beside Demos in the customer sidebar.

   Which number depends on who approves. When the customer's own team
   approves, the count is what is waiting for them in Staging — the only
   number that asks for an action. When Driftwood approves, nothing waits on
   them, so the count is what is scheduled to go out.

   The policy read is tiny and comes first, so only one of the two lists is
   ever fetched; the Demos page shares both promises, so opening the page
   costs no extra request. */

import { useEffect, useState } from "react";
import {
  approvalPolicy,
  firstQueuePage,
  firstReviewsPage,
} from "./staging-api";
import { groupStagedDemos, queueSends } from "./staging-model";

export async function demosNavCount(): Promise<number> {
  const policy = await approvalPolicy();
  if (policy.mode === "auto") {
    const page = await firstQueuePage();
    return queueSends(page.sends).length;
  }
  const page = await firstReviewsPage();
  return groupStagedDemos(page.pending.filter((item) => item.can_decide)).length;
}

/* null until the count is known, and it stays null when the read fails —
   a wrong number beside a nav item is worse than no number. */
export function useDemosNavCount(active: boolean): number | null {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!active) return;
    let live = true;
    demosNavCount().then(
      (value) => {
        if (live) setCount(value);
      },
      () => {},
    );
    return () => {
      live = false;
    };
  }, [active]);

  return count;
}
