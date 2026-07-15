/* Injects the prerendered landing markup into dist/index.html after the
   client build. Fails the build loudly if the root div isn't found or the
   render comes back suspiciously small — a silently empty prerender would
   quietly undo the whole point. */
import { readFileSync, writeFileSync } from "node:fs";

const { render } = await import("../dist-ssr/prerender-entry.js");
const html = render();
if (html.length < 5_000) {
  throw new Error(`prerender output suspiciously small (${html.length} chars)`);
}

const target = new URL("../dist/index.html", import.meta.url);
const doc = readFileSync(target, "utf8");
const anchor = '<div id="root"></div>';
if (!doc.includes(anchor)) {
  throw new Error("dist/index.html has no empty #root div to fill");
}
writeFileSync(target, doc.replace(anchor, `<div id="root">${html}</div>`));
console.log(`prerendered landing into dist/index.html (+${(html.length / 1024).toFixed(1)} kB of markup)`);

/* Stamp the sitemap's lastmod with the build date — the hand-written date in
   public/sitemap.xml rots silently otherwise. */
const sitemap = new URL("../dist/sitemap.xml", import.meta.url);
const stamped = readFileSync(sitemap, "utf8").replace(
  /<lastmod>[^<]*<\/lastmod>/,
  `<lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>`,
);
writeFileSync(sitemap, stamped);
console.log(`stamped sitemap lastmod ${new Date().toISOString().slice(0, 10)}`);
