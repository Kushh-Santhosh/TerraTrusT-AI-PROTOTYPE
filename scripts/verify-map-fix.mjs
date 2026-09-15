import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE_URL = "http://localhost:3000";
const SCREENSHOTS_DIR = path.resolve("./screenshots/map_verification");
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

async function verifyMap() {
  console.log("================================================================");
  console.log("         TERRATRUST AI — REAL CHROME GIS MAP VERIFICATION       ");
  console.log("================================================================");

  let browser;
  try {
    browser = await puppeteer.connect({
      browserURL: "http://127.0.0.1:9222",
      defaultViewport: { width: 1440, height: 900 },
    });
    console.log("[BROWSER] Connected to active Chrome desktop on port 9222");
  } catch (err) {
    console.log("[BROWSER] Launching new Chrome instance...");
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"],
      defaultViewport: { width: 1440, height: 900 },
    });
  }

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const tileRequests = [];
  const consoleErrors = [];
  const failedRequests = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const txt = msg.text();
      if (!txt.includes("favicon.ico")) {
        console.warn(`[CONSOLE ERROR] ${txt}`);
        consoleErrors.push(txt);
      }
    }
  });

  page.on("response", (resp) => {
    const url = resp.url();
    const status = resp.status();
    if (url.includes("tile.openstreetmap.org") || url.includes("basemaps.cartocdn.com")) {
      const isSuccess = resp.ok() || status === 304;
      tileRequests.push({ url, status, ok: isSuccess });
    }
    if (status >= 400 && !url.includes("favicon.ico")) {
      console.warn(`[FAILED REQUEST] ${status} ${url}`);
      failedRequests.push({ url, status });
    }
  });

  // 1. Navigate to /map
  console.log("\n[1/6] Navigating to /map in Chrome Desktop...");
  await page.goto(`${BASE_URL}/map`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 3000));

  // Check canvas exists
  const canvasExists = await page.evaluate(
    () => !!document.querySelector("canvas.maplibregl-canvas"),
  );
  console.log(`[MAP] Canvas element rendered: ${canvasExists}`);

  // Take initial screenshot of /map
  const initialScreenshotPath = path.join(SCREENSHOTS_DIR, "01_map_initial.png");
  await page.screenshot({ path: initialScreenshotPath });
  console.log(`[SCREENSHOT] Saved: ${initialScreenshotPath}`);

  // Check attribution
  const attributionText = await page.evaluate(
    () => document.querySelector(".maplibregl-ctrl-attrib")?.textContent?.trim() || "",
  );
  console.log(`[MAP] Attribution visible: "${attributionText}"`);

  // 2. Zoom In
  console.log("\n[2/6] Testing Zoom In...");
  const zoomInClicked = await page.evaluate(() => {
    const btn = document.querySelector(".maplibregl-ctrl-zoom-in");
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log(`[MAP] Zoom-in button clicked: ${zoomInClicked}`);
  await new Promise((r) => setTimeout(r, 1500));
  const zoomInScreenshot = path.join(SCREENSHOTS_DIR, "02_map_zoomed_in.png");
  await page.screenshot({ path: zoomInScreenshot });
  console.log(`[SCREENSHOT] Saved: ${zoomInScreenshot}`);

  // 3. Zoom Out
  console.log("\n[3/6] Testing Zoom Out...");
  await page.evaluate(() => {
    const btn = document.querySelector(".maplibregl-ctrl-zoom-out");
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 1500));
  const zoomOutScreenshot = path.join(SCREENSHOTS_DIR, "03_map_zoomed_out.png");
  await page.screenshot({ path: zoomOutScreenshot });
  console.log(`[SCREENSHOT] Saved: ${zoomOutScreenshot}`);

  // 4. Pan map
  console.log("\n[4/6] Testing Pan map...");
  await page.mouse.move(720, 450);
  await page.mouse.down();
  await page.mouse.move(520, 350, { steps: 10 });
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 1500));
  const panScreenshot = path.join(SCREENSHOTS_DIR, "04_map_panned.png");
  await page.screenshot({ path: panScreenshot });
  console.log(`[SCREENSHOT] Saved: ${panScreenshot}`);

  // 5. Click a property marker
  console.log("\n[5/6] Clicking property marker...");
  const markerClicked = await page.evaluate(() => {
    const markers = Array.from(document.querySelectorAll(".cursor-pointer"));
    if (markers.length > 0) {
      markers[0].click();
      return true;
    }
    return false;
  });
  console.log(`[MAP] Marker clicked: ${markerClicked}`);
  await new Promise((r) => setTimeout(r, 1000));
  const markerScreenshot = path.join(SCREENSHOTS_DIR, "05_map_marker_selected.png");
  await page.screenshot({ path: markerScreenshot });
  console.log(`[SCREENSHOT] Saved: ${markerScreenshot}`);

  // 6. Test property GIS page
  console.log("\n[6/6] Testing property GIS layers page (/properties/p_001/gis-layers)...");
  await page.goto(`${BASE_URL}/properties/p_001/gis-layers`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await new Promise((r) => setTimeout(r, 3000));

  // Toggle a GIS layer
  const toggled = await page.evaluate(() => {
    const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
    if (checkboxes.length > 2) {
      checkboxes[2].click();
      return true;
    }
    return false;
  });
  console.log(`[GIS LAYERS] Toggled spatial layer: ${toggled}`);
  await new Promise((r) => setTimeout(r, 800));

  const propGisScreenshot = path.join(SCREENSHOTS_DIR, "06_property_gis_layers.png");
  await page.screenshot({ path: propGisScreenshot });
  console.log(`[SCREENSHOT] Saved: ${propGisScreenshot}`);

  // Verification Summary
  const successfulTiles = tileRequests.filter((t) => t.ok).length;
  const failedTiles = tileRequests.filter((t) => !t.ok).length;

  console.log("\n================================================================");
  console.log("                   MAP VERIFICATION SUMMARY                     ");
  console.log("================================================================");
  console.log(`Total tile requests: ${tileRequests.length}`);
  console.log(`Successful tile responses (HTTP 200/304): ${successfulTiles}`);
  console.log(`Failed tile responses: ${failedTiles}`);
  console.log(`Console errors: ${consoleErrors.length}`);
  console.log(`Failed network requests: ${failedRequests.length}`);
  if (tileRequests.length > 0) {
    console.log(`Sample tile URL: ${tileRequests[0].url}`);
  }

  const report = {
    timestamp: new Date().toISOString(),
    canvasExists,
    attributionText,
    totalTileRequests: tileRequests.length,
    successfulTiles,
    failedTiles,
    sampleTileUrl: tileRequests[0]?.url || "none",
    consoleErrors,
    failedRequests,
    status: successfulTiles > 0 && failedTiles === 0 ? "PASS" : "FAIL",
  };

  fs.writeFileSync(
    path.join(SCREENSHOTS_DIR, "map-qa-report.json"),
    JSON.stringify(report, null, 2),
  );

  await page.close();
}

verifyMap().catch((err) => {
  console.error("[FATAL ERROR IN MAP VERIFICATION]", err);
  process.exit(1);
});
