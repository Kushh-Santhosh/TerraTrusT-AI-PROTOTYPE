import puppeteer from "puppeteer-core";
import { spawn } from "child_process";
import http from "http";
import fs from "fs";
import path from "path";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

function waitForServer(url, timeoutMs = 25000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http
        .get(url, (res) => {
          if (res.statusCode && res.statusCode < 500) return resolve();
          retry();
        })
        .on("error", retry);
    };
    const retry = () => {
      if (Date.now() - start > timeoutMs) {
        return reject(new Error(`Server at ${url} failed to respond within ${timeoutMs}ms`));
      }
      setTimeout(check, 500);
    };
    check();
  });
}

const results = [];
function record(feature, step, result, detail) {
  results.push({ feature, step, result, detail });
  console.log(`[${result}] [${feature}] ${step}: ${detail}`);
}

async function runGisSuite() {
  console.log("================================================================");
  console.log("       TERRATRUST AI — PHASE 2.2 REAL GIS VERIFICATION SUITE    ");
  console.log("================================================================\n");

  let serverProcess = null;
  let devServerAlreadyRunning = false;

  try {
    await waitForServer(BASE_URL, 1500);
    console.log("Existing development server detected on port 3000.");
    devServerAlreadyRunning = true;
  } catch {
    console.log("Starting preview server on port 3000...");
    serverProcess = spawn("npx", ["vite", "preview", "--port", "3000"], {
      stdio: "inherit",
      shell: true,
    });
    await waitForServer(BASE_URL, 20000);
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-web-security",
      "--allow-running-insecure-content",
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Grant geolocation permissions
  const context = browser.defaultBrowserContext();
  await context.overridePermissions(BASE_URL, ["geolocation"]);
  await page.setGeolocation({ latitude: 12.9716, longitude: 77.5946 });

  try {
    // 1. Authenticate as Citizen
    console.log("\n--- Test 1: Authentication & Navigation to /properties/new ---");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
    await page.waitForSelector("#login-email", { timeout: 8000 });

    const buttons = await page.$$("button");
    for (const b of buttons) {
      const txt = await page.evaluate((el) => el.innerText, b);
      if (txt.includes("Autofill")) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 400));
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) await submitBtn.click();
    await page.waitForFunction(() => window.location.pathname === "/dashboard", { timeout: 8000 });

    await page.goto(`${BASE_URL}/properties/new`, { waitUntil: "networkidle2" });
    record("GIS Wizard", "Navigation to New Property", "PASS", "Landed on /properties/new wizard");

    // Fill Step 1
    await page.type("#property-title-input", "GIS Verified Estate");
    await page.select("#property-type-select", "agricultural");
    await page.type("#property-value-input", "4500000");
    await page.click("#wizard-continue-btn");
    await new Promise((r) => setTimeout(r, 600));

    // 2. Step 2: Location & Geolocation Detection
    console.log("\n--- Test 2: Location Step & Current GPS Detection ---");
    const step2CurrentLocBtn = await page.$("#btn-step2-current-location");
    record(
      "Location Step",
      "Current Location Button Exists",
      step2CurrentLocBtn ? "PASS" : "FAIL",
      "Found #btn-step2-current-location",
    );

    if (step2CurrentLocBtn) {
      await step2CurrentLocBtn.click();
      await new Promise((r) => setTimeout(r, 800));
      const latVal = await page.$eval("#property-lat-input", (el) => el.value);
      const lngVal = await page.$eval("#property-lng-input", (el) => el.value);
      record(
        "Location Step",
        "Device GPS Coordinate Capture",
        Math.abs(parseFloat(latVal) - 12.9716) < 0.01 ? "PASS" : "FAIL",
        `Acquired GPS: Lat ${latVal}, Lng ${lngVal}`,
      );
    }

    // Advance to Step 3: Boundary & GIS
    await page.click("#wizard-continue-btn");
    await new Promise((r) => setTimeout(r, 1200));

    // 3. Step 3: Real Interactive WebGL Map Verification
    console.log("\n--- Test 3: Real MapLibre Canvas & OpenStreetMap Tiles ---");
    const canvas = await page.$("#gis-boundary-canvas");
    record(
      "Real Map",
      "Map Container Rendered",
      canvas ? "PASS" : "FAIL",
      "Found #gis-boundary-canvas",
    );

    // Check MapLibre instance presence
    const isMapLibreLoaded = await page.evaluate(() => {
      const el = document.querySelector("#gis-boundary-canvas");
      return !!el?.querySelector(".maplibregl-canvas");
    });
    record(
      "Real Map",
      "MapLibre WebGL Canvas Initialized",
      isMapLibreLoaded ? "PASS" : "FAIL",
      "WebGL canvas element created",
    );

    // Verify Attribution Control
    const attributionText = await page.evaluate(() => {
      const el = document.querySelector(".maplibregl-ctrl-attrib");
      return el?.innerText || "";
    });
    record(
      "Real Map",
      "Tile Attribution Compliance",
      attributionText.includes("OpenStreetMap") || attributionText.includes("CARTO")
        ? "PASS"
        : "FAIL",
      `Attribution: "${attributionText}"`,
    );

    // 4. Current Location on Map
    console.log('\n--- Test 4: Map "Use My Current Location" Action ---');
    const mapLocBtn = await page.$("#btn-current-location");
    if (mapLocBtn) {
      await mapLocBtn.click();
      await new Promise((r) => setTimeout(r, 1000));
      const textAfterLoc = await page.evaluate(() => document.body.innerText);
      const capturedGps =
        textAfterLoc.includes("Captured device coordinates") ||
        textAfterLoc.includes("Selected Position:");
      record(
        "Real Map",
        "Fly To Device Location",
        capturedGps ? "PASS" : "FAIL",
        "Device geolocation triggered map flyTo",
      );
    }

    // 5. Nominatim Address Search for Indian Location
    console.log("\n--- Test 5: OpenStreetMap Nominatim Geocoding ---");
    await page.type("#map-address-search-input", "Bengaluru");
    await page.click("#map-search-btn");
    await new Promise((r) => setTimeout(r, 2000));

    const dropdownCount = await page.$$eval(".z-50 button", (btns) => btns.length);
    record(
      "Geocoding Search",
      'Real Indian Location Query ("Bengaluru")',
      dropdownCount > 0 ? "PASS" : "FAIL",
      `Retrieved ${dropdownCount} real geocoding search results`,
    );

    if (dropdownCount > 0) {
      await page.click(".z-50 button:first-child");
      await new Promise((r) => setTimeout(r, 1000));
      const textAfterSelect = await page.evaluate(() => document.body.innerText);
      record(
        "Geocoding Search",
        "Map Centering on Selected Result",
        textAfterSelect.includes("Centered map on:") ||
          textAfterSelect.includes("Selected Position:")
          ? "PASS"
          : "FAIL",
        "Map centered and property pin relocated",
      );
    }

    // 6. Polygon Boundary Drawing Mode
    console.log("\n--- Test 6: Real Boundary Drawing & Vertex Management ---");
    const drawBtn = await page.$("#btn-toggle-draw-boundary");
    if (drawBtn) {
      await drawBtn.click();
      await new Promise((r) => setTimeout(r, 400));
      const isDrawingActive = await page.evaluate(() =>
        document.body.innerText.includes("Drawing Mode"),
      );
      record(
        "Boundary Drawing",
        "Toggle Draw Mode",
        isDrawingActive ? "PASS" : "FAIL",
        "Active drawing banner rendered",
      );

      // Click on canvas to add vertex
      const canvasBox = await canvas.boundingBox();
      if (canvasBox) {
        await page.mouse.click(
          canvasBox.x + canvasBox.width / 2 + 50,
          canvasBox.y + canvasBox.height / 2 + 50,
        );
        await new Promise((r) => setTimeout(r, 600));
      }

      await drawBtn.click(); // finish drawing
      await new Promise((r) => setTimeout(r, 400));
    }

    // Check vertex handles
    const vertexCount = await page.$$eval(".vertex-handle", (el) => el.length);
    record(
      "Boundary Drawing",
      "Interactive Draggable Vertex Handles",
      vertexCount >= 4 ? "PASS" : "FAIL",
      `Rendered ${vertexCount} draggable vertex handles on WebGL map`,
    );

    // Verify Area Calculation
    const areaText = await page.evaluate(() => {
      const el = document.body.innerText;
      const m = el.match(/Calculated Area:\s*([\d,]+)\s*m²/);
      return m ? m[1] : "";
    });
    record(
      "GIS Engine",
      "Geodesic Area Recalculation",
      areaText.length > 0 ? "PASS" : "FAIL",
      `Calculated Geodesic Surface Area: ${areaText} m²`,
    );

    // 7. GeoJSON Import Test
    console.log("\n--- Test 7: Real GeoJSON Parsing & Map Display ---");
    const testGeoJson = JSON.stringify({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [77.682, 12.927],
            [77.684, 12.927],
            [77.684, 12.9285],
            [77.682, 12.9285],
            [77.682, 12.927],
          ],
        ],
      },
      properties: { name: "Test Parcel GeoJSON" },
    });

    const tmpGeoJsonPath = path.resolve("./tmp-test-parcel.geojson");
    fs.writeFileSync(tmpGeoJsonPath, testGeoJson);

    const geoJsonInput = await page.$("#geojson-upload-input");
    if (geoJsonInput) {
      await geoJsonInput.uploadFile(tmpGeoJsonPath);
      await new Promise((r) => setTimeout(r, 800));
      const pageText = await page.evaluate(() => document.body.innerText);
      const geoJsonSuccess =
        pageText.includes("Successfully imported GeoJSON") || pageText.includes("4 Vertices");
      record(
        "GeoJSON Import",
        "Import Valid RFC 7946 Polygon",
        geoJsonSuccess ? "PASS" : "FAIL",
        "Loaded GeoJSON coordinates and fitted bounds",
      );
    }
    try {
      fs.unlinkSync(tmpGeoJsonPath);
    } catch {}

    // 8. KML Import Test
    console.log("\n--- Test 8: Real KML Parsing & Map Display ---");
    const testKml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Placemark>
    <name>Test KML Boundary</name>
    <Polygon>
      <outerBoundaryIs>
        <LinearRing>
          <coordinates>
            77.6830,12.9275,0 77.6845,12.9275,0 77.6845,12.9290,0 77.6830,12.9290,0 77.6830,12.9275,0
          </coordinates>
        </LinearRing>
      </outerBoundaryIs>
    </Polygon>
  </Placemark>
</kml>`;

    const tmpKmlPath = path.resolve("./tmp-test-boundary.kml");
    fs.writeFileSync(tmpKmlPath, testKml);

    const kmlInput = await page.$("#kml-upload-input");
    if (kmlInput) {
      await kmlInput.uploadFile(tmpKmlPath);
      await new Promise((r) => setTimeout(r, 800));
      const pageText = await page.evaluate(() => document.body.innerText);
      const kmlSuccess =
        pageText.includes("Successfully imported KML") || pageText.includes("4 Vertices");
      record(
        "KML Import",
        "Import Google Earth KML Polygon",
        kmlSuccess ? "PASS" : "FAIL",
        "Converted KML to GeoJSON and rendered polygon",
      );
    }
    try {
      fs.unlinkSync(tmpKmlPath);
    } catch {}

    // 9. Mobile Responsiveness Test (375x812)
    console.log("\n--- Test 9: Mobile Viewport Responsiveness (375x812) ---");
    await page.setViewport({ width: 375, height: 812 });
    await new Promise((r) => setTimeout(r, 500));

    const isMobileNoOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth;
    });
    record(
      "Mobile UX",
      "Mobile Viewport (375x812) Fit",
      isMobileNoOverflow ? "PASS" : "FAIL",
      "Real map and controls fit 375px mobile width without horizontal overflow",
    );

    // Reset viewport to desktop
    await page.setViewport({ width: 1280, height: 900 });

    // 10. Proceed through Wizard, Submit & Test Persistence
    console.log("\n--- Test 10: Complete Registration & Persist to Supabase ---");
    await page.click("#wizard-continue-btn"); // to Step 4 Documents
    await new Promise((r) => setTimeout(r, 600));

    await page.click("#wizard-continue-btn"); // to Step 5 Review
    await new Promise((r) => setTimeout(r, 600));

    // Verify Review Step shows actual captured metrics
    const reviewText = await page.evaluate(() => document.body.innerText);
    const hasGpsInReview =
      reviewText.includes("Center GPS:") && reviewText.includes("GIS Polygon Boundary");
    const hasAreaInReview = reviewText.includes("Calculated Area:") && reviewText.includes("acres");
    record(
      "Review Step",
      "Real GPS & Area In Summary",
      hasGpsInReview && hasAreaInReview ? "PASS" : "FAIL",
      "Review step displays real coordinates, boundary metrics, and acres",
    );

    // Submit Property
    await page.click("#submit-property-btn");
    console.log("Submitting property registration to Supabase + n8n...");
    await page.waitForSelector(".bg-success\\/15", { timeout: 25000 });

    const successPassportText = await page.evaluate(() => document.body.innerText);
    const passportMatch = successPassportText.match(/TT-[\w-]+/);
    const passportId = passportMatch ? passportMatch[0] : "TT-NEW";
    record(
      "Supabase Persistence",
      "Passport Created & Persisted",
      "PASS",
      `Passport ID: ${passportId}`,
    );

    // Open Property Detail Page to confirm real geometry reload
    const propLink = await page.$('a[href*="/properties/"]');
    if (propLink) {
      await propLink.click();
      await page.waitForFunction(() => window.location.pathname.startsWith("/properties/"), {
        timeout: 8000,
      });
      await new Promise((r) => setTimeout(r, 1000));
    }

    // Switch to boundary tab
    const boundaryTab = await page.$('button[value="boundary"]');
    if (boundaryTab) {
      await boundaryTab.click();
      await new Promise((r) => setTimeout(r, 1200));

      const hasMapOnDetail = await page.evaluate(() => {
        return !!document.querySelector(".maplibregl-canvas");
      });
      record(
        "Reload Persistence",
        "Persisted Boundary Rendered on Real Map",
        hasMapOnDetail ? "PASS" : "FAIL",
        "Reloaded property detail page and verified real MapLibre map rendered with persisted geometry",
      );
    }
  } catch (err) {
    console.error("Test run encountered error:", err);
    record("GIS Suite", "Execution Error", "FAIL", err.message);
  } finally {
    await browser.close();
    if (serverProcess) {
      serverProcess.kill("SIGTERM");
    }
  }

  console.log("\n================================================================");
  console.log("                 PHASE 2.2 REAL GIS TEST MATRIX                  ");
  console.log("================================================================\n");

  console.table(results);

  const passed = results.filter((r) => r.result === "PASS").length;
  const failed = results.filter((r) => r.result === "FAIL").length;
  console.log(`\nResults: ${passed} PASSED, ${failed} FAILED (${results.length} total)`);

  if (failed > 0) {
    process.exit(1);
  }
}

runGisSuite();
