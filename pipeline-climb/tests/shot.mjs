// Headless screenshot helper for Pipeline Climb scenes.
// Usage: node tests/shot.mjs <scene> <theme> <outfile> [extraHash]
//   scene     e.g. 5
//   theme     light | crt
//   outfile   absolute or repo-relative png path
//   extraHash optional extra hash params, e.g. "run" or "lang=jp"
import path from 'node:path';
import { createRequire } from 'node:module';
import fs from 'node:fs';

// Playwright is only available in the user's global npx cache, not the
// project node_modules. Resolve it from NODE_PATH (a :-separated list of
// node_modules dirs) or from the known npx cache, via createRequire so the
// ESM loader doesn't choke.
function resolvePlaywright() {
  const candidates = [];
  if (process.env.NODE_PATH) candidates.push(...process.env.NODE_PATH.split(':'));
  const npx = path.join(process.env.HOME || '', '.npm', '_npx');
  try {
    for (const d of fs.readdirSync(npx)) {
      candidates.push(path.join(npx, d, 'node_modules'));
    }
  } catch (e) {}
  for (const base of candidates) {
    const pkg = path.join(base, 'playwright', 'package.json');
    if (fs.existsSync(pkg)) {
      const req = createRequire(path.join(base, 'x.js'));
      return req('playwright');
    }
  }
  throw new Error('playwright not found in NODE_PATH or ~/.npm/_npx');
}
const { chromium } = resolvePlaywright();

const [, , scene = '5', theme = 'light', outRel = `tests/shots/current/s${scene}-${theme}.png`, extra = ''] = process.argv;
const root = path.resolve(import.meta.dirname, '..');
const file = 'file://' + path.join(root, 'index.html');
let hash = `#scene=${scene}&theme=${theme}`;
if (extra) hash += '&' + extra;
const url = file + hash;
const out = path.isAbsolute(outRel) ? outRel : path.join(root, outRel);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

await page.goto(url, { waitUntil: 'networkidle' });
// Give scenes (animations, &run primary click, katex) time to settle.
await page.waitForTimeout(extra.includes('run') ? 2600 : 1100);
await page.screenshot({ path: out });
await browser.close();

if (errors.length) {
  console.log('ERRORS for scene ' + scene + ' (' + theme + '):');
  for (const e of errors) console.log('  ' + e);
} else {
  console.log('OK scene ' + scene + ' (' + theme + ') -> ' + out + (extra ? ' [' + extra + ']' : ''));
}
