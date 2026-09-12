import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium, webkit, devices } from "playwright";

const base = process.env.DEMO_TEST_BASE_URL ?? "http://127.0.0.1:5181";
const screenshotDir = process.env.DEMO_TEST_SCREENSHOTS;
const axe = await readFile(new URL("../node_modules/axe-core/axe.min.js", import.meta.url), "utf8");

async function load(page, mode = "1") {
  await page.goto(`${base}/dashboard/demos?mock=${mode}`);
  await page.getByRole("heading", { name: "Sample company", exact: true }).waitFor();
  // Observe the app's mocked fetch path. All feedback remains local to this page.
  await page.evaluate(() => {
    const original = window.fetch;
    window.demoFeedbackRequests = [];
    window.holdDemoFeedback = false;
    window.replaceDemoVersion = false;
    window.fetch = async (url, init) => {
      if (String(url).includes("/dashboard/demos/") && init?.method === "POST") {
        window.demoFeedbackRequests.push(JSON.parse(init.body));
        if (window.holdDemoFeedback) await new Promise(resolve => { window.releaseDemoFeedback = resolve; });
      }
      const response = await original(url, init);
      if (window.replaceDemoVersion && String(url).includes("/dashboard/demos?") && !init?.method) {
        const body = await response.json();
        body.demos = body.demos.map(demo => ({ ...demo, updated_at: "2026-09-12T12:00:00.123456Z" }));
        return Response.json(body);
      }
      return response;
    };
  });
}

async function companyDemos(page) {
  await load(page);
  await page.evaluate(() => {
    const original = window.fetch;
    window.companyFeedbackUrl = null;
    window.fetch = async (url, init) => {
      if (String(url).includes("/dashboard/demos/") && init?.method === "POST") window.companyFeedbackUrl = String(url);
      const response = await original(url, init);
      if (String(url).includes("/dashboard/demos?") && !init?.method) {
        const body = await response.json();
        body.demos = body.demos.map((demo, index) => ({
          ...demo, demo_id: `html:${index + 1}`, lead_id: null, lead_name: null,
          preview_url: `/api/v1/dashboard/demos/html:${index + 1}/preview`,
        }));
        return Response.json(body);
      }
      return response;
    };
  });
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await page.getByRole("button", { name: /Sample company Company demo/ }).waitFor();
  assert.equal(await page.getByRole("link", { name: "Open demo", exact: true }).getAttribute("href"), "/api/v1/dashboard/demos/html:1/preview");
  assert.match(await page.locator(".demo-detail-heading p").innerText(), /^Updated /);
  await page.getByRole("button", { name: /Sample account Company demo/ }).click();
  await page.getByRole("heading", { name: "Sample account", exact: true }).waitFor();
  await page.getByRole("button", { name: "Looks good", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Glad you like it." }).waitFor();
  assert.equal(await page.evaluate(() => window.companyFeedbackUrl), "/api/v1/dashboard/demos/html%3A2/feedback");
  await page.getByRole("button", { name: /Sample company Company demo/ }).click();
  assert.equal(await page.getByRole("status").filter({ hasText: "Glad you like it." }).count(), 0);
  if (screenshotDir) await page.locator(".demos-page").screenshot({ path: `${screenshotDir}/company-demos-${page.viewportSize().width}.png` });
}

async function requests(page) {
  return page.evaluate(() => window.demoFeedbackRequests);
}

async function accessible(page) {
  // Run test instrumentation through the browser debugger so production CSP
  // stays intact; inserting an inline script tag is correctly blocked there.
  await page.evaluate(axe);
  const violations = await page.evaluate(async () => {
    const result = await window.axe.run(document.querySelector(".demo-feedback"), { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } });
    return result.violations.map(({ id, nodes }) => ({ id, nodes: nodes.map(({ html, failureSummary }) => ({ html, failureSummary })) }));
  });
  assert.deepEqual(violations, []);
}

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  const changes = page.getByRole("button", { name: "Request changes", exact: true });
  const note = page.getByRole("textbox", { name: "What should we change?", exact: true });
  const send = page.getByRole("button", { name: "Send feedback", exact: true });
  const confirmation = page.getByRole("status").filter({ hasText: "The Driftwood team has been notified." });
  const imageDemo = page.getByRole("button", { name: /Sample account Another example lead/ });
  const videoDemo = page.getByRole("button", { name: /Sample company Example lead/ });

  await load(page);
  assert.equal(await page.getByRole("textbox").count(), 0);
  await accessible(page);
  if (screenshotDir) await page.locator(".demo-detail").screenshot({ path: `${screenshotDir}/feedback-compact.png` });
  await page.getByRole("button", { name: "Looks good", exact: true }).click();
  await confirmation.waitFor();
  assert.equal((await requests(page)).length, 1);
  assert.equal((await requests(page))[0].message, "Looks good.");
  assert.equal((await requests(page))[0].sentiment, "looks_good");
  await page.getByRole("button", { name: "Add a note", exact: true }).click();
  await page.getByRole("textbox", { name: "Anything else you’d like to share?" }).fill("The opening is much clearer.");
  await send.click();
  await confirmation.waitFor();
  assert.equal((await requests(page))[1].sentiment, "general");
  await accessible(page);

  await load(page);
  await page.waitForFunction(() => document.querySelector("video")?.readyState >= 1);
  await page.locator("video").evaluate(video => { video.currentTime = 12.75; });
  await changes.click();
  await note.fill("Shorten the intro and show the product sooner.");
  await page.getByRole("button", { name: "Attach 0:12", exact: true }).click();
  assert.equal(await page.locator("video").evaluate(video => video.paused), true);
  await page.locator("video").evaluate(video => { video.currentTime = 20; });
  await page.getByRole("button", { name: "0:12 attached · Remove", exact: true }).waitFor();
  await accessible(page);
  if (screenshotDir) await page.locator(".demo-feedback").screenshot({ path: `${screenshotDir}/feedback-timestamp.png` });
  await imageDemo.click();
  await changes.click();
  assert.equal(await page.getByRole("button", { name: /Attach/ }).count(), 0);
  await videoDemo.click();
  assert.equal(await note.inputValue(), "Shorten the intro and show the product sooner.");
  await page.getByRole("button", { name: "0:12 attached · Remove", exact: true }).waitFor();
  await send.click();
  await confirmation.waitFor();
  const timestamped = (await requests(page))[0];
  assert.equal(timestamped.message, "At 0:12 in the video:\nShorten the intro and show the product sooner.");
  assert.equal(timestamped.sentiment, "needs_changes");
  assert.equal(timestamped.artifact_id, "demo-artifact-1");
  assert.ok(timestamped.artifact_updated_at);

  await load(page, "demos-feedback-error");
  await page.getByRole("button", { name: "Looks good", exact: true }).click();
  await page.getByRole("alert").filter({ hasText: "could not be delivered" }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Looks good", exact: true }).isEnabled(), true);
  assert.equal(await confirmation.count(), 0);
  await changes.click();
  await note.fill("Keep this draft if delivery fails.");
  await page.waitForFunction(() => document.querySelector("video")?.readyState >= 1);
  await page.getByRole("button", { name: "Attach 0:00", exact: true }).click();
  await send.click();
  await page.getByRole("alert").filter({ hasText: "could not be delivered" }).waitFor();
  assert.equal(await note.inputValue(), "Keep this draft if delivery fails.");
  assert.equal(await send.isEnabled(), true);
  await page.getByRole("button", { name: "0:00 attached · Remove", exact: true }).waitFor();

  await load(page);
  await page.evaluate(() => { window.holdDemoFeedback = true; });
  await changes.click();
  await note.fill("Only send this once while I switch demos.");
  await send.click();
  await page.getByRole("button", { name: "Sending…", exact: true }).waitFor();
  await imageDemo.click();
  await videoDemo.click();
  assert.equal(await page.getByRole("button", { name: "Sending…", exact: true }).isDisabled(), true);
  assert.equal((await requests(page)).length, 1);
  await page.evaluate(() => window.releaseDemoFeedback());
  await confirmation.waitFor();

  await load(page);
  await changes.click();
  await note.fill("a".repeat(2000));
  await page.waitForFunction(() => document.querySelector("video")?.readyState >= 1);
  await page.getByRole("button", { name: "Attach 0:00", exact: true }).click();
  await page.getByRole("alert").filter({ hasText: "Shorten your note" }).waitFor();
  assert.equal(await send.isDisabled(), true);
  assert.equal((await note.inputValue()).length, 2000);
  await page.getByRole("button", { name: "0:00 attached · Remove", exact: true }).click();
  assert.equal(await send.isEnabled(), true);
  await note.fill("This draft is for the old version.");
  await page.evaluate(() => { window.replaceDemoVersion = true; });
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await changes.waitFor();
  await changes.click();
  assert.equal(await note.inputValue(), "");

  await companyDemos(page);

  await load(page, "member");
  await page.getByText("Your workspace seat is read-only.", { exact: false }).waitFor();
  assert.equal(await changes.count(), 0);
  assert.equal(await page.getByRole("button", { name: "Looks good", exact: true }).count(), 0);
  assert.deepEqual(errors, []);
  console.log("Desktop passed: quick reaction, optional note, exact timestamp, version scoping, retained drafts, failed delivery, pending-send deduplication, message limit, read-only access, accessibility, console.");
} finally {
  await browser.close();
}

const mobile = await webkit.launch({ headless: true, ...(process.env.DEMO_TEST_WEBKIT_PATH ? { executablePath: process.env.DEMO_TEST_WEBKIT_PATH } : {}) });
try {
  const page = await mobile.newPage({ ...devices["iPhone 13"] });
  await load(page);
  await page.getByRole("button", { name: "Request changes", exact: true }).click();
  await page.getByRole("textbox", { name: "What should we change?" }).fill("Make the call to action clearer.");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  if (screenshotDir) await page.locator(".demo-feedback").screenshot({ path: `${screenshotDir}/feedback-mobile.png` });
  await page.getByRole("button", { name: "Send feedback", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "The Driftwood team has been notified." }).waitFor();
  await page.getByRole("button", { name: "Leave another note" }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("button", { name: "Looks good", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Glad you like it." }).waitFor();
  await page.setViewportSize({ width: 320, height: 740 });
  await page.getByRole("button", { name: "Add a note", exact: true }).click();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await companyDemos(page);
  console.log("iPhone WebKit passed: notes, quick reaction, cancellation and responsive layout down to 320px.");
} finally {
  await mobile.close();
}
