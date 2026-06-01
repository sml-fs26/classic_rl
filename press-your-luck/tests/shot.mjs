// Headless screenshot helper for pokemon-battle scenes.
// Usage: node tests/shot.mjs <scene> <theme> <width> <outfile> [extraHash]
//   scene     e.g. 4
//   theme     light | crt
//   width     viewport width in px (e.g. 390 or 1400); height fixed to 900
//   outfile   absolute or repo-relative png path
//   extraHash optional extra hash params, e.g. "run"
// Also logs document scrollWidth vs viewport width so horizontal overflow is
// caught in code (the page must NOT be wider than the viewport on mobile).
import path from 'node:path';
import { createRequire } from 'node:module';
import fs from 'node:fs';

function resolvePlaywright() {
  const candidates = [];
  if (process.env.NODE_PATH) candidates.push(...process.env.NODE_PATH.split(':'));
  // pipeline-climb sibling carries a resolved playwright in its node_modules.
  candidates.push(path.resolve(import.meta.dirname, '..', '..', 'pipeline-climb', 'node_modules'));
  const npx = path.join(process.env.HOME || '', '.npm', '_npx');
  try {
    for (const d of fs.readdirSync(npx)) candidates.push(path.join(npx, d, 'node_modules'));
  } catch (e) {}
  for (const base of candidates) {
    const pkg = path.join(base, 'playwright', 'package.json');
    if (fs.existsSync(pkg)) {
      const req = createRequire(path.join(base, 'x.js'));
      return req('playwright');
    }
  }
  throw new Error('playwright not found in NODE_PATH, sibling node_modules, or ~/.npm/_npx');
}
const { chromium } = resolvePlaywright();

const [, , scene = '4', theme = 'light', widthArg = '390',
  outRel = `tests/shots/current/s${scene}-${theme}-${widthArg}.png`, extra = 'run'] = process.argv;
const width = parseInt(widthArg, 10) || 390;
const root = path.resolve(import.meta.dirname, '..');
const file = 'file://' + path.join(root, 'index.html');
let hash = `#scene=${scene}&theme=${theme}`;
if (extra) hash += '&' + extra;
const url = file + hash;
const out = path.isAbsolute(outRel) ? outRel : path.join(root, outRel);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(extra.includes('run') ? 2600 : 1100);

// Measure horizontal overflow: scrollWidth must not exceed the viewport width.
const metrics = await page.evaluate(() => ({
  scrollW: document.documentElement.scrollWidth,
  clientW: document.documentElement.clientWidth,
  innerW: window.innerWidth,
}));

// Capture the full page so a clipped/overflowing ledger column is visible.
await page.screenshot({ path: out, fullPage: true });
await browser.close();

const overflow = metrics.scrollW - metrics.clientW;
const tag = `scene ${scene} (${theme}, ${width}px)`;
console.log(`OK ${tag} -> ${out}${extra ? ' [' + extra + ']' : ''}`);
console.log(`   scrollW=${metrics.scrollW} clientW=${metrics.clientW} innerW=${metrics.innerW} overflowX=${overflow}px ${overflow > 1 ? 'OVERFLOW!' : 'ok'}`);
if (errors.length) {
  console.log('ERRORS:');
  for (const e of errors) console.log('  ' + e);
}
