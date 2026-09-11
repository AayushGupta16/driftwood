import { chromium, webkit, devices } from 'playwright';
import assert from 'node:assert/strict';
const base = 'http://127.0.0.1:5191';
for (const mobile of [false, true]) {
 const browser = await (mobile ? webkit : chromium).launch({headless:true});
 try {
  const page = await browser.newPage(mobile ? {...devices['iPhone 13']} : {viewport:{width:1440,height:1000}});
  const errors=[]; page.on('pageerror',e => errors.push(e.message));
  await page.goto(`${base}/dashboard/settings?mock=1`);
  await page.getByRole('heading',{name:'Send schedule',exact:true}).waitFor();
  const tabs=page.getByRole('navigation',{name:'Settings views'});
  await tabs.getByRole('link',{name:'Sending accounts',exact:true}).click();
  await page.getByRole('heading',{name:'Sending accounts',exact:true}).waitFor();
  await tabs.getByRole('link',{name:'Product & brand assets',exact:true}).click();
  await tabs.getByRole('link',{name:'Product & brand assets',exact:true}).waitFor();
  assert.equal(await tabs.getByRole('link',{name:'Product & brand assets',exact:true}).getAttribute('aria-current'),'page');
  await tabs.getByRole('link',{name:'Team',exact:true}).click();
  await page.getByRole('heading',{name:'Team',exact:true}).waitFor();
  await tabs.getByRole('link',{name:'Send schedule',exact:true}).click();
  await page.getByRole('heading',{name:'Send schedule',exact:true}).waitFor();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.screenshot({path:`/private/tmp/driftwood-dashboard-review-shots/pr1-settings-${mobile ? 'mobile' : 'desktop'}.png`,fullPage:true});
  assert.deepEqual(errors,[]);
  console.log(`${mobile ? 'iPhone WebKit' : 'Desktop Chromium'} settings navigation, send schedule and sending accounts passed.`);
 } finally { await browser.close(); }
}
