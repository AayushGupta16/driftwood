import { chromium } from "playwright";
const browser = await chromium.launch();

// ----- desktop -----
const d = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const errors = [];
d.on("pageerror", (e) => errors.push(String(e)));
await d.goto("http://localhost:5179", { waitUntil: "networkidle" });
await d.waitForTimeout(600);
await d.screenshot({ path: "/tmp/d-hero.png" });
// wedge animation: scroll to it fresh and capture mid + end
await d.locator("#wedge").scrollIntoViewIfNeeded();
await d.waitForTimeout(500);
await d.screenshot({ path: "/tmp/d-wedge-mid.png" });
await d.waitForTimeout(1500);
await d.locator("#wedge").screenshot({ path: "/tmp/d-wedge.png" });
// how section: personalize + iterate vignettes
const { top, height } = await d.evaluate(() => {
  const wrap = document.querySelector("#how > div");
  const r = wrap.getBoundingClientRect();
  return { top: r.top + window.scrollY, height: wrap.offsetHeight };
});
const total = height - 900;
await d.evaluate(({ top, total }) => window.scrollTo(0, top + (total / 4) * 1.5), { top, total });
await d.waitForTimeout(700);
await d.screenshot({ path: "/tmp/d-personalize.png" });
await d.evaluate(({ top, total }) => window.scrollTo(0, top + (total / 4) * 3.5), { top, total });
await d.waitForTimeout(700);
await d.screenshot({ path: "/tmp/d-iterate.png" });
// hero animation height stability
await d.evaluate(() => window.scrollTo(0, 0));
const heights = new Set();
for (let i = 0; i < 30; i++) {
  heights.add(await d.evaluate(() => Math.round(document.querySelector('div.relative.grid[aria-hidden="true"]').getBoundingClientRect().height)));
  await d.waitForTimeout(400);
}
console.log("desktop hero heights:", [...heights]);
await d.close();

// ----- mobile -----
const m = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await m.goto("http://localhost:5179", { waitUntil: "networkidle" });
await m.waitForTimeout(600);
console.log("mobile horiz overflow:", await m.evaluate(() => document.documentElement.scrollWidth > 390));
// build stage: card height should hug content now
const mh = await m.evaluate(() => {
  const stage = document.querySelector('div.relative.grid[aria-hidden="true"]');
  const build = stage.children[0].firstElementChild;
  return { stage: Math.round(stage.getBoundingClientRect().height), build: Math.round(build.getBoundingClientRect().height) };
});
console.log("mobile build-stage:", JSON.stringify(mh));
await m.screenshot({ path: "/tmp/m-hero2.png", fullPage: false });
await m.locator("#wedge").scrollIntoViewIfNeeded();
await m.waitForTimeout(1800);
await m.locator("#wedge").screenshot({ path: "/tmp/m-wedge2.png" });
await m.close();
console.log("page errors:", errors.length ? errors : "none");
await browser.close();
