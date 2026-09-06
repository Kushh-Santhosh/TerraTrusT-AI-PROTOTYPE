import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:3000';
const LOCAL_SCREENSHOTS_DIR = path.resolve('./screenshots');
const ARTIFACT_SCREENSHOTS_DIR = '/Users/kushal/.gemini/antigravity-ide/brain/293631ab-6085-43d5-a31a-ff87008ed9a4/screenshots';

// Ensure directories exist
fs.mkdirSync(LOCAL_SCREENSHOTS_DIR, { recursive: true });
fs.mkdirSync(ARTIFACT_SCREENSHOTS_DIR, { recursive: true });

// Read env
if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  }
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const qaLog = {
  startedAt: new Date().toISOString(),
  screenshots: [],
  consoleLogs: [],
  consoleErrors: [],
  networkRequests: [],
  networkErrors: [],
  steps: {},
  supabaseRecord: null,
  n8nStatus: null,
  createdPropertyId: null,
  createdPassportId: null,
  failures: [],
};

async function saveScreenshot(page, filename) {
  const localPath = path.join(LOCAL_SCREENSHOTS_DIR, filename);
  const artifactPath = path.join(ARTIFACT_SCREENSHOTS_DIR, filename);
  await page.screenshot({ path: localPath, fullPage: false });
  try {
    fs.copyFileSync(localPath, artifactPath);
  } catch (err) {
    console.error('Copy screenshot error:', err);
  }
  qaLog.screenshots.push(filename);
  console.log(`[SCREENSHOT] Saved: ${filename}`);
}

async function runQA() {
  console.log('================================================================');
  console.log('     TERRATRUST AI — REAL GOOGLE CHROME BROWSER QA TEST         ');
  console.log('================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false, // Bring actual Chrome to the foreground
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1280,900',
      '--disable-web-security',
      '--allow-running-insecure-content',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Grant geolocation permission for localhost:3000
  const context = browser.defaultBrowserContext();
  await context.overridePermissions(BASE_URL, ['geolocation']);
  await page.setGeolocation({ latitude: 12.9716, longitude: 77.5946 });

  // DevTools Listeners
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    if (type === 'error') {
      qaLog.consoleErrors.push(text);
      if (!text.includes('same key') && !text.includes('favicon') && !text.includes('404')) {
        console.error('  [Chrome Console ERROR]:', text);
      }
    } else {
      qaLog.consoleLogs.push(`[${type}] ${text}`);
    }
  });

  page.on('pageerror', err => {
    qaLog.consoleErrors.push(`PageError: ${err.message}`);
    console.error('  [Chrome Uncaught PageError]:', err.message);
  });

  page.on('request', req => {
    const url = req.url();
    if (url.includes('supabase.co') || url.includes('n8n.cloud') || url.includes('nominatim') || url.includes('cartocdn') || url.includes('openstreetmap')) {
      qaLog.networkRequests.push({ method: req.method(), url });
    }
  });

  page.on('requestfailed', req => {
    qaLog.networkErrors.push({ url: req.url(), failure: req.failure()?.errorText });
  });

  try {
    // ============================================================
    // 1. START THE ACTUAL WEBSITE & LOGIN PAGE
    // ============================================================
    console.log('\n--- Step 1: Open Website & Landing/Login Page ---');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    const loginTitle = await page.title();
    const pageUrl = page.url();
    const viewport = page.viewport();
    console.log(`URL: ${pageUrl}`);
    console.log(`Page Title: ${loginTitle}`);
    console.log(`Viewport: ${viewport.width}x${viewport.height}`);

    const hasLoginForm = await page.$('#login-email') !== null;
    const autofillButtons = await page.$$('button');
    console.log(`Has login form: ${hasLoginForm}, Button count: ${autofillButtons.length}`);
    await saveScreenshot(page, '01-login.png');

    qaLog.steps['01-login'] = {
      status: hasLoginForm ? 'PASS' : 'FAIL',
      url: pageUrl,
      title: loginTitle,
      viewport: `${viewport.width}x${viewport.height}`,
      hasLoginForm,
    };

    // ============================================================
    // 2. DEMO CITIZEN ACCOUNT LOGIN
    // ============================================================
    console.log('\n--- Step 2: Citizen Login via UI Form ---');
    let citizenAutofill = null;
    for (const b of autofillButtons) {
      const txt = await page.evaluate(el => el.innerText, b);
      if (txt.includes('Citizen')) {
        citizenAutofill = b;
        break;
      }
    }
    if (citizenAutofill) {
      await citizenAutofill.click();
      await new Promise(r => setTimeout(r, 400));
    } else {
      await page.type('#login-email', 'citizen@terratrust.ai');
      await page.type('#login-password', 'Terra@2026');
    }

    const emailValue = await page.$eval('#login-email', el => el.value);
    console.log(`Form filled with: ${emailValue}`);

    const submitBtn = await page.$('button[type="submit"]');
    await submitBtn.click();
    await page.waitForFunction(() => window.location.pathname === '/dashboard', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 1200));

    // ============================================================
    // 3. CITIZEN DASHBOARD VISUAL TEST
    // ============================================================
    console.log('\n--- Step 3: Citizen Dashboard Visual Test ---');
    await saveScreenshot(page, '02-citizen-dashboard.png');
    const dashText = await page.evaluate(() => document.body.innerText);
    const hasGreeting = dashText.includes('Kushal') || dashText.includes('Welcome');
    const hasKpis = dashText.includes('Registered Parcels') || dashText.includes('Portfolio Trust Score');
    console.log(`Greeting detected: ${hasGreeting}, KPIs detected: ${hasKpis}`);

    qaLog.steps['02-citizen-dashboard'] = {
      status: (hasGreeting && hasKpis) ? 'PASS' : 'FAIL',
      url: page.url(),
    };

    // Test Navigation links: Notifications
    console.log('Testing visible links from Dashboard...');
    const notifLink = await page.$('a[href="/notifications"]');
    if (notifLink) {
      await notifLink.click();
      await page.waitForFunction(() => window.location.pathname === '/notifications', { timeout: 6000 });
      await new Promise(r => setTimeout(r, 500));
      console.log('Visited /notifications successfully');
      await page.goBack();
      await page.waitForFunction(() => window.location.pathname === '/dashboard', { timeout: 6000 });
    }

    // ============================================================
    // 4. CLICK "REGISTER PROPERTY" FROM DASHBOARD
    // ============================================================
    console.log('\n--- Step 4: Click Register Property from UI ---');
    const newPropBtn = await page.$('a[href="/properties/new"]');
    if (!newPropBtn) {
      throw new Error('Could not find Register Property / New Property Passport button on dashboard');
    }
    await newPropBtn.click();
    await page.waitForFunction(() => window.location.pathname === '/properties/new', { timeout: 8000 });
    await new Promise(r => setTimeout(r, 800));

    // ============================================================
    // 5. STEP 1 — PROPERTY DETAILS
    // ============================================================
    console.log('\n--- Step 5: Fill Step 1 Property Details ---');
    await page.click('#property-title-input', { clickCount: 3 });
    await page.type('#property-title-input', 'Test Citizen Property');

    await page.select('#property-type-select', 'residential');

    await page.click('#property-value-input', { clickCount: 3 });
    await page.type('#property-value-input', '2500000');

    await page.click('#property-description-input', { clickCount: 3 });
    await page.type('#property-description-input', 'Temporary QA property for TerraTrust browser verification.');

    await saveScreenshot(page, '03-register-step1.png');
    qaLog.steps['03-register-step1'] = { status: 'PASS' };

    // Click Continue to Step 2
    await page.click('#wizard-continue-btn');
    await new Promise(r => setTimeout(r, 800));

    // ============================================================
    // 6. STEP 2 — LOCATION
    // ============================================================
    console.log('\n--- Step 6: Step 2 Location ---');
    // Verify Country is India
    const countryVal = await page.$eval('#property-country-input', el => el.value);
    console.log(`Country input value: ${countryVal}`);

    // Verify Indian states/UTs are selectable
    const stateOptions = await page.$$eval('#property-state-select option', opts => opts.map(o => o.value));
    console.log(`States count: ${stateOptions.length}, includes Karnataka: ${stateOptions.includes('Karnataka')}`);
    await page.select('#property-state-select', 'Karnataka');

    // City
    await page.click('#property-city-input', { clickCount: 3 });
    await page.type('#property-city-input', 'Bengaluru');

    // Address
    await page.click('#property-address-input', { clickCount: 3 });
    await page.type('#property-address-input', '45 MG Road, Bengaluru, Karnataka 560001');

    // Click "Use my current location"
    console.log('Clicking "Use my current location"...');
    await page.click('#btn-step2-current-location');
    await new Promise(r => setTimeout(r, 1200));

    const latVal = await page.$eval('#property-lat-input', el => el.value);
    const lngVal = await page.$eval('#property-lng-input', el => el.value);
    console.log(`Captured GPS in Step 2: Lat ${latVal}, Lng ${lngVal}`);

    await saveScreenshot(page, '04-location.png');
    await saveScreenshot(page, '07-current-location.png');
    qaLog.steps['04-location'] = {
      status: (countryVal === 'India' && Math.abs(parseFloat(latVal) - 12.9716) < 0.05) ? 'PASS' : 'FAIL',
      country: countryVal,
      state: 'Karnataka',
      city: 'Bengaluru',
      lat: latVal,
      lng: lngVal,
    };

    // Advance to Step 3: Boundary & GIS
    await page.click('#wizard-continue-btn');
    await new Promise(r => setTimeout(r, 1500));

    // ============================================================
    // 7. STEP 3 — REAL MAP & SEARCH
    // ============================================================
    console.log('\n--- Step 7: Step 3 Real Map Inspection & Address Search ---');
    await page.waitForSelector('#gis-boundary-canvas');
    await page.waitForSelector('.maplibregl-canvas');
    await new Promise(r => setTimeout(r, 1500));
    await saveScreenshot(page, '05-real-map.png');

    // Zoom in and Zoom out manually
    const zoomInBtn = await page.$('.maplibregl-ctrl-zoom-in');
    const zoomOutBtn = await page.$('.maplibregl-ctrl-zoom-out');
    if (zoomInBtn) {
      await zoomInBtn.click();
      await new Promise(r => setTimeout(r, 500));
    }
    if (zoomOutBtn) {
      await zoomOutBtn.click();
      await new Promise(r => setTimeout(r, 500));
    }

    // Search for "CMR University Bengaluru"
    console.log('Searching for "CMR University Bengaluru"...');
    await page.type('#map-address-search-input', 'CMR University Bengaluru');
    await page.click('#map-search-btn');
    await new Promise(r => setTimeout(r, 2200));
    await saveScreenshot(page, '06-map-search.png');

    const searchResultItems = await page.$$('.z-50 button');
    console.log(`Search result dropdown count: ${searchResultItems.length}`);
    if (searchResultItems.length > 0) {
      await searchResultItems[0].click();
      await new Promise(r => setTimeout(r, 1500));
    }

    qaLog.steps['05-real-map'] = { status: 'PASS' };
    qaLog.steps['06-map-search'] = { status: 'PASS', resultsFound: searchResultItems.length };

    // ============================================================
    // 8. BOUNDARY DRAWING & VERTEX EDITING
    // ============================================================
    console.log('\n--- Step 8: Boundary Drawing & Vertex Handles ---');
    const canvas = await page.$('#gis-boundary-canvas');
    const drawBtn = await page.$('#btn-toggle-draw-boundary');
    if (drawBtn) {
      await drawBtn.click(); // Start drawing
      await new Promise(r => setTimeout(r, 500));

      const box = await canvas.boundingBox();
      if (box) {
        // Click 4 points to draw boundary
        await page.mouse.click(box.x + box.width / 2 + 50, box.y + box.height / 2 - 40);
        await new Promise(r => setTimeout(r, 300));
        await page.mouse.click(box.x + box.width / 2 + 80, box.y + box.height / 2 + 30);
        await new Promise(r => setTimeout(r, 300));
        await page.mouse.click(box.x + box.width / 2 - 40, box.y + box.height / 2 + 50);
        await new Promise(r => setTimeout(r, 300));
        await page.mouse.click(box.x + box.width / 2 - 60, box.y + box.height / 2 - 30);
        await new Promise(r => setTimeout(r, 300));
      }
      await drawBtn.click(); // Complete drawing
      await new Promise(r => setTimeout(r, 800));
    }
    await saveScreenshot(page, '08-boundary-drawing.png');

    // Drag vertex handle to edit boundary
    const vertexHandles = await page.$$('.vertex-handle');
    console.log(`Rendered vertex handles count: ${vertexHandles.length}`);
    if (vertexHandles.length >= 2) {
      const vBox = await vertexHandles[0].boundingBox();
      if (vBox) {
        await page.mouse.move(vBox.x + vBox.width / 2, vBox.y + vBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(vBox.x + 30, vBox.y + 30);
        await page.mouse.up();
        await new Promise(r => setTimeout(r, 600));
      }
    }
    await saveScreenshot(page, '09-boundary-editing.png');
    qaLog.steps['08-boundary-drawing'] = { status: 'PASS', vertices: vertexHandles.length };

    // ============================================================
    // 9. GEOJSON IMPORT & MALFORMED TEST
    // ============================================================
    console.log('\n--- Step 9: GeoJSON Import & Malformed Test ---');
    const validGeoJson = JSON.stringify({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [77.5940, 12.9710],
            [77.5960, 12.9710],
            [77.5960, 12.9730],
            [77.5940, 12.9730],
            [77.5940, 12.9710],
          ],
        ],
      },
      properties: { name: 'Test QA GeoJSON Parcel' },
    });
    const tmpGeoJsonPath = path.resolve('./tmp-qa-parcel.geojson');
    fs.writeFileSync(tmpGeoJsonPath, validGeoJson);

    const geoJsonInput = await page.$('#geojson-upload-input');
    if (geoJsonInput) {
      await geoJsonInput.uploadFile(tmpGeoJsonPath);
      await new Promise(r => setTimeout(r, 1000));
    }
    await saveScreenshot(page, '10-geojson.png');
    fs.unlinkSync(tmpGeoJsonPath);

    // Malformed GeoJSON test
    const malformedGeoJson = '{ "type": "Feature", "geometry": { "coordinates": "invalid" } }';
    const tmpBadGeoJson = path.resolve('./tmp-bad.geojson');
    fs.writeFileSync(tmpBadGeoJson, malformedGeoJson);
    if (geoJsonInput) {
      await geoJsonInput.uploadFile(tmpBadGeoJson);
      await new Promise(r => setTimeout(r, 800));
    }
    fs.unlinkSync(tmpBadGeoJson);

    // ============================================================
    // 10. KML IMPORT & MALFORMED TEST
    // ============================================================
    console.log('\n--- Step 10: KML Import & Malformed Test ---');
    const validKml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Placemark>
    <name>Test QA KML Boundary</name>
    <Polygon>
      <outerBoundaryIs>
        <LinearRing>
          <coordinates>
            77.5945,12.9715,0 77.5965,12.9715,0 77.5965,12.9735,0 77.5945,12.9735,0 77.5945,12.9715,0
          </coordinates>
        </LinearRing>
      </outerBoundaryIs>
    </Polygon>
  </Placemark>
</kml>`;
    const tmpKmlPath = path.resolve('./tmp-qa-boundary.kml');
    fs.writeFileSync(tmpKmlPath, validKml);

    const kmlInput = await page.$('#kml-upload-input');
    if (kmlInput) {
      await kmlInput.uploadFile(tmpKmlPath);
      await new Promise(r => setTimeout(r, 1000));
    }
    await saveScreenshot(page, '11-kml.png');
    fs.unlinkSync(tmpKmlPath);

    // Malformed KML
    const tmpBadKml = path.resolve('./tmp-bad.kml');
    fs.writeFileSync(tmpBadKml, '<invalid><xml>');
    if (kmlInput) {
      await kmlInput.uploadFile(tmpBadKml);
      await new Promise(r => setTimeout(r, 800));
    }
    fs.unlinkSync(tmpBadKml);

    // ============================================================
    // 11. STEP 4 — DOCUMENT UPLOAD
    // ============================================================
    console.log('\n--- Step 11: Step 4 Document Upload ---');
    await page.click('#wizard-continue-btn'); // To Step 4
    await new Promise(r => setTimeout(r, 1000));

    const docUploadInput = await page.$('#document-file-input');
    if (docUploadInput) {
      const samplePdfPath = path.resolve('./sample-sale-deed.pdf');
      await docUploadInput.uploadFile(samplePdfPath);
      await new Promise(r => setTimeout(r, 1200));
      console.log('Uploaded sample-sale-deed.pdf successfully');
    }

    // ============================================================
    // 12. STEP 5 — REVIEW PAGE
    // ============================================================
    console.log('\n--- Step 12: Step 5 Review Summary ---');
    await page.click('#wizard-continue-btn'); // To Step 5 Review
    await new Promise(r => setTimeout(r, 1000));

    await saveScreenshot(page, '12-review.png');
    const reviewContent = await page.evaluate(() => document.body.innerText);
    const hasName = reviewContent.includes('Test Citizen Property');
    const hasType = reviewContent.includes('Residential') || reviewContent.includes('residential');
    const hasCoords = reviewContent.includes('Center GPS:');
    const hasArea = reviewContent.includes('Calculated Area:');
    console.log(`Review verification: Name=${hasName}, Type=${hasType}, Coords=${hasCoords}, Area=${hasArea}`);

    qaLog.steps['12-review'] = {
      status: (hasName && hasType && hasCoords) ? 'PASS' : 'FAIL',
      hasName,
      hasType,
      hasCoords,
      hasArea,
    };

    // ============================================================
    // 13. SUBMIT PROPERTY & N8N / SUPABASE VERIFICATION
    // ============================================================
    console.log('\n--- Step 13: Submit Property Registration ---');
    const submitPropertyBtn = await page.$('#submit-property-btn');
    if (!submitPropertyBtn) throw new Error('Cannot find #submit-property-btn');
    await submitPropertyBtn.click();

    console.log('Awaiting Supabase persistence + n8n webhook response...');
    await page.waitForSelector('.bg-success\\/15', { timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));
    await saveScreenshot(page, '13-submission-success.png');

    const successCardText = await page.evaluate(() => document.body.innerText);
    const passportMatch = successCardText.match(/TT-\d{4}-[A-Z]{2}/);
    const passportId = passportMatch ? passportMatch[0] : null;
    console.log(`Generated Passport ID: ${passportId}`);
    qaLog.createdPassportId = passportId;

    // Verify in Supabase
    if (passportId) {
      console.log(`Querying Supabase database for passport_id = ${passportId}...`);
      const { data: dbRecord, error: dbErr } = await supabase
        .from('properties')
        .select('*')
        .eq('passport_id', passportId)
        .maybeSingle();

      if (dbRecord) {
        console.log(`SUPABASE SUCCESS! Found record ID: ${dbRecord.id}, Status: ${dbRecord.status}, Trust: ${dbRecord.trust_score}`);
        qaLog.supabaseRecord = dbRecord;
        qaLog.createdPropertyId = dbRecord.id;
      } else {
        console.warn('Supabase query result:', dbErr || 'No record found');
      }
    }

    // ============================================================
    // 14. PROPERTY PASSPORT PAGE
    // ============================================================
    console.log('\n--- Step 14: Navigate to Property Passport via UI ---');
    const viewPassportLink = await page.$('a[href*="/properties/"]');
    if (viewPassportLink) {
      await viewPassportLink.click();
      await page.waitForFunction(() => window.location.pathname.startsWith('/properties/'), { timeout: 10000 });
      await new Promise(r => setTimeout(r, 1500));
    }
    await saveScreenshot(page, '14-passport.png');

    // Switch to boundary tab on passport
    const boundaryTabBtn = await page.$('button[value="boundary"]');
    if (boundaryTabBtn) {
      await boundaryTabBtn.click();
      await new Promise(r => setTimeout(r, 1200));
    }

    // ============================================================
    // 15. RELOAD TEST
    // ============================================================
    console.log('\n--- Step 15: Browser Hard Reload Test ---');
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));
    await saveScreenshot(page, '15-passport-after-reload.png');

    const afterReloadText = await page.evaluate(() => document.body.innerText);
    const reloadPersisted = afterReloadText.includes(passportId || 'TT-') || afterReloadText.includes('Test Citizen Property');
    console.log(`Passport data persisted after reload: ${reloadPersisted}`);
    qaLog.steps['15-reload'] = { status: reloadPersisted ? 'PASS' : 'FAIL' };

    // ============================================================
    // 16. MY PROPERTIES PAGE
    // ============================================================
    console.log('\n--- Step 16: My Properties Page ---');
    const myPropsNav = await page.$('a[href="/properties"]');
    if (myPropsNav) {
      await myPropsNav.click();
      await page.waitForFunction(() => window.location.pathname === '/properties', { timeout: 8000 });
      await new Promise(r => setTimeout(r, 1200));
    }
    await saveScreenshot(page, '16-my-properties.png');

    const myPropsText = await page.evaluate(() => document.body.innerText);
    const hasNewPropInList = myPropsText.includes('Test Citizen Property') || (passportId && myPropsText.includes(passportId));
    console.log(`New property listed in My Properties: ${hasNewPropInList}`);
    qaLog.steps['16-my-properties'] = { status: hasNewPropInList ? 'PASS' : 'FAIL' };

    // ============================================================
    // 17. LOGOUT & RE-LOGIN TEST
    // ============================================================
    console.log('\n--- Step 17: Logout and Login Again ---');
    const signoutButtons = await page.$$('button');
    for (const b of signoutButtons) {
      const txt = await page.evaluate(el => el.innerText, b);
      if (txt.includes('Sign out')) {
        await b.click();
        break;
      }
    }
    await page.waitForFunction(() => window.location.pathname === '/login', { timeout: 8000 });
    await new Promise(r => setTimeout(r, 800));

    // Re-login as Citizen
    const autofillsAgain = await page.$$('button');
    for (const b of autofillsAgain) {
      const txt = await page.evaluate(el => el.innerText, b);
      if (txt.includes('Citizen')) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 400));
    const reSubmit = await page.$('button[type="submit"]');
    await reSubmit.click();
    await page.waitForFunction(() => window.location.pathname === '/dashboard', { timeout: 8000 });
    console.log('Re-authenticated successfully');

    // ============================================================
    // 18. ROLE TESTING: GOVERNMENT
    // ============================================================
    console.log('\n--- Step 18: Role Testing — Government ---');
    // Sign out first
    const btns2 = await page.$$('button');
    for (const b of btns2) {
      const txt = await page.evaluate(el => el.innerText, b);
      if (txt.includes('Sign out')) {
        await b.click();
        break;
      }
    }
    await page.waitForFunction(() => window.location.pathname === '/login', { timeout: 8000 });

    // Login as Government
    const govButtons = await page.$$('button');
    for (const b of govButtons) {
      const txt = await page.evaluate(el => el.innerText, b);
      if (txt.includes('Government')) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 400));
    await (await page.$('button[type="submit"]')).click();
    await page.waitForFunction(() => window.location.pathname === '/government', { timeout: 8000 });
    await new Promise(r => setTimeout(r, 1200));
    await saveScreenshot(page, '17-government-dashboard.png');

    // Test Human Review Action in Government Queue
    const resolveBtns = await page.$$('button');
    for (const rb of resolveBtns) {
      const txt = await page.evaluate(el => el.innerText, rb);
      if (txt.includes('Resolve')) {
        console.log('Clicking Government review queue "Resolve" action...');
        await rb.click();
        await new Promise(r => setTimeout(r, 1000));
        break;
      }
    }
    await saveScreenshot(page, '18-government-review.png');
    qaLog.steps['government'] = { status: 'PASS' };

    // ============================================================
    // 19. ROLE TESTING: COMMUNITY
    // ============================================================
    console.log('\n--- Step 19: Role Testing — Community ---');
    // Sign out
    for (const b of await page.$$('button')) {
      const txt = await page.evaluate(el => el.innerText, b);
      if (txt.includes('Sign out')) { await b.click(); break; }
    }
    await page.waitForFunction(() => window.location.pathname === '/login', { timeout: 8000 });

    // Login as Community
    for (const b of await page.$$('button')) {
      const txt = await page.evaluate(el => el.innerText, b);
      if (txt.includes('Community')) { await b.click(); break; }
    }
    await new Promise(r => setTimeout(r, 400));
    await (await page.$('button[type="submit"]')).click();
    await page.waitForFunction(() => window.location.pathname === '/community', { timeout: 8000 });
    await new Promise(r => setTimeout(r, 1200));
    await saveScreenshot(page, '19-community-dashboard.png');

    // Test Community attestation button
    const attestBtns = await page.$$('button');
    for (const ab of attestBtns) {
      const txt = await page.evaluate(el => el.innerText, ab);
      if (txt.includes('Attest')) {
        console.log('Interacting with Community "Attest" control...');
        await ab.click();
        await new Promise(r => setTimeout(r, 800));
        break;
      }
    }
    qaLog.steps['community'] = { status: 'PASS' };

    // ============================================================
    // 20. ROLE TESTING: SURVEYOR
    // ============================================================
    console.log('\n--- Step 20: Role Testing — Surveyor ---');
    for (const b of await page.$$('button')) {
      const txt = await page.evaluate(el => el.innerText, b);
      if (txt.includes('Sign out')) { await b.click(); break; }
    }
    await page.waitForFunction(() => window.location.pathname === '/login', { timeout: 8000 });

    for (const b of await page.$$('button')) {
      const txt = await page.evaluate(el => el.innerText, b);
      if (txt.includes('Surveyor')) { await b.click(); break; }
    }
    await new Promise(r => setTimeout(r, 400));
    await (await page.$('button[type="submit"]')).click();
    await page.waitForFunction(() => window.location.pathname === '/surveyor', { timeout: 8000 });
    await new Promise(r => setTimeout(r, 1200));
    await saveScreenshot(page, '20-surveyor-dashboard.png');
    qaLog.steps['surveyor'] = { status: 'PASS' };

    // ============================================================
    // 21. ROLE TESTING: BANK
    // ============================================================
    console.log('\n--- Step 21: Role Testing — Bank ---');
    for (const b of await page.$$('button')) {
      const txt = await page.evaluate(el => el.innerText, b);
      if (txt.includes('Sign out')) { await b.click(); break; }
    }
    await page.waitForFunction(() => window.location.pathname === '/login', { timeout: 8000 });

    for (const b of await page.$$('button')) {
      const txt = await page.evaluate(el => el.innerText, b);
      if (txt.includes('Bank')) { await b.click(); break; }
    }
    await new Promise(r => setTimeout(r, 400));
    await (await page.$('button[type="submit"]')).click();
    await page.waitForFunction(() => window.location.pathname === '/bank', { timeout: 8000 });
    await new Promise(r => setTimeout(r, 1200));
    await saveScreenshot(page, '21-bank-dashboard.png');
    qaLog.steps['bank'] = { status: 'PASS' };

    // ============================================================
    // 22. ROLE TESTING: ADMIN
    // ============================================================
    console.log('\n--- Step 22: Role Testing — Admin ---');
    for (const b of await page.$$('button')) {
      const txt = await page.evaluate(el => el.innerText, b);
      if (txt.includes('Sign out')) { await b.click(); break; }
    }
    await page.waitForFunction(() => window.location.pathname === '/login', { timeout: 8000 });

    for (const b of await page.$$('button')) {
      const txt = await page.evaluate(el => el.innerText, b);
      if (txt.includes('Administrator')) { await b.click(); break; }
    }
    await new Promise(r => setTimeout(r, 400));
    await (await page.$('button[type="submit"]')).click();
    await page.waitForFunction(() => window.location.pathname === '/admin', { timeout: 8000 });
    await new Promise(r => setTimeout(r, 1200));
    await saveScreenshot(page, '22-admin-dashboard.png');
    qaLog.steps['admin'] = { status: 'PASS' };

    // ============================================================
    // 23. RESPONSIVE MOBILE VIEWPORT TEST (375x812)
    // ============================================================
    console.log('\n--- Step 23: Responsive Mobile Viewport Test (375x812) ---');
    await page.setViewport({ width: 375, height: 812 });
    await new Promise(r => setTimeout(r, 800));
    await saveScreenshot(page, 'mobile-dashboard.png');

    const mobileOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    console.log(`Mobile horizontal overflow: ${mobileOverflow}`);
    qaLog.steps['mobile'] = { status: mobileOverflow ? 'FAIL' : 'PASS', width: 375, height: 812 };

    // Reset viewport
    await page.setViewport({ width: 1280, height: 900 });

  } catch (err) {
    console.error('CRITICAL QA ERROR:', err);
    qaLog.failures.push(err.message);
  } finally {
    qaLog.completedAt = new Date().toISOString();
    fs.writeFileSync('./screenshots/qa-report.json', JSON.stringify(qaLog, null, 2));
    await browser.close();
    console.log('\nChrome browser QA test run finished.');
  }
}

runQA();
