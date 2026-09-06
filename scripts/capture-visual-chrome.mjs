import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:3000';
const ARTIFACT_DIR = '/Users/kushal/.gemini/antigravity-ide/brain/fb9882bc-49e5-45a9-8260-7cbe30290b5c';

async function runVisualChromeWalkthrough() {
  console.log('Starting visual Chrome walkthrough with screenshots...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const context = browser.defaultBrowserContext();
  await context.overridePermissions(BASE_URL, ['geolocation']);
  await page.setGeolocation({ latitude: 12.9716, longitude: 77.5946 });

  // 1. Sign In
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const txt = await page.evaluate(el => el.innerText, b);
    if (txt.includes('Autofill')) {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 400));
  const submitBtn = await page.$('button[type="submit"]');
  if (submitBtn) await submitBtn.click();
  await page.waitForFunction(() => window.location.pathname === '/dashboard', { timeout: 8000 });

  // 2. Go to /properties/new
  await page.goto(`${BASE_URL}/properties/new`, { waitUntil: 'networkidle2' });
  await page.type('#property-title-input', 'Kushal GIS Residency & Tech Park');
  await page.select('#property-type-select', 'commercial');
  await page.type('#property-value-input', '75000000');
  await page.click('#wizard-continue-btn');
  await new Promise(r => setTimeout(r, 600));

  // 3. Step 2 Location
  await page.click('#btn-step2-current-location');
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'step2_geolocation.png'), fullPage: false });

  await page.click('#wizard-continue-btn');
  await new Promise(r => setTimeout(r, 1200));

  // 4. Step 3 Boundary & GIS - Real Map Loaded
  await page.waitForSelector('.maplibregl-canvas');
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'step3_real_map_initial.png'), fullPage: false });

  // 5. Search for "CMR University"
  await page.type('#map-address-search-input', 'CMR University');
  await page.click('#map-search-btn');
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'step3_search_results.png'), fullPage: false });

  const resultItem = await page.$('.z-50 button:first-child');
  if (resultItem) {
    await resultItem.click();
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'step3_search_centered.png'), fullPage: false });
  }

  // 6. Draw Boundary & Vertex handles
  await page.click('#btn-toggle-draw-boundary');
  await new Promise(r => setTimeout(r, 500));
  const canvas = await page.$('#gis-boundary-canvas');
  const box = await canvas.boundingBox();
  if (box) {
    await page.mouse.click(box.x + box.width / 2 + 40, box.y + box.height / 2 + 30);
    await new Promise(r => setTimeout(r, 500));
  }
  await page.click('#btn-toggle-draw-boundary');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'step3_boundary_polygon.png'), fullPage: false });

  // 7. Proceed to Review
  await page.click('#wizard-continue-btn'); // Documents
  await new Promise(r => setTimeout(r, 600));
  await page.click('#wizard-continue-btn'); // Review
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'step5_review_summary.png'), fullPage: false });

  // 8. Submit Property
  await page.click('#submit-property-btn');
  await page.waitForSelector('.bg-success\\/15', { timeout: 25000 });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'submission_success.png'), fullPage: false });

  console.log('All visual Chrome screenshots captured successfully.');
  await browser.close();
}

runVisualChromeWalkthrough();
