import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(root, 'temporary screenshots');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';

function nextIndex() {
  const existing = fs.readdirSync(outDir).filter(f => /^screenshot-\d+/.test(f));
  const nums = existing.map(f => parseInt(f.match(/^screenshot-(\d+)/)[1], 10));
  return nums.length ? Math.max(...nums) + 1 : 1;
}

const n = nextIndex();
const fileName = `screenshot-${n}${label ? '-' + label : ''}.png`;
const outPath = path.join(outDir, fileName);

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle0' });
await page.evaluate(() => document.fonts.ready);

// Resize the viewport to the full document height so every element is
// simultaneously in view for capture. This avoids two Puppeteer fullPage
// quirks: position:fixed elements duplicating/mispositioning, and
// scroll-triggered (IntersectionObserver) reveal animations never firing
// for content that a stitched screenshot never actually scrolls past.
const fullHeight = await page.evaluate(() => document.documentElement.scrollHeight);
await page.setViewport({ width: 1440, height: fullHeight });
await new Promise(r => setTimeout(r, 500));

await page.screenshot({ path: outPath });
await browser.close();

console.log(`Saved ${outPath}`);
