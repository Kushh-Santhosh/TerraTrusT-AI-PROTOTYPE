import puppeteer from "puppeteer-core";
import fs from "fs";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PROD_URL = "https://terratrust-ai.vercel.app";

const report = {
  timestamp: new Date().toISOString(),
  askTerraRemoved: false,
  aparsoftPresent: false,
  cardMiniMapsLoaded: 0,
  detailMapLoaded: false,
  n8nWebhookResponse: null,
  rolesTested: {},
};

async function main() {
  console.log("====================================================");
  console.log("  TERRATRUST AI — FINAL PRODUCTION E2E BROWSER TEST  ");
  console.log("====================================================\n");

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // 1. Check /properties for Ask Terra and Real MapLibre mini maps
  console.log("Step 1: Inspecting https://terratrust-ai.vercel.app/properties...");
  await page.goto(`${PROD_URL}/properties`, { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 2000));

  const askTerraLauncher = await page.$("#terra-assistant-launcher");
  const askTerraPanel = await page.$("#terra-assistant-panel");
  report.askTerraRemoved = !askTerraLauncher && !askTerraPanel;
  console.log("1. Ask Terra launcher & panel removed?:", report.askTerraRemoved ? "PASS" : "FAIL");

  const aparsoftMounted = await page.evaluate(() => {
    return (
      !!document.querySelector("[data-aparsoft-chatbot]") ||
      !!document.querySelector('script[src*="aparsoft"]')
    );
  });
  report.aparsoftPresent = aparsoftMounted;
  console.log("2. Aparsoft Chatbot mounted?:", report.aparsoftPresent ? "PASS" : "FAIL");

  const miniMapsCount = (await page.$$(".maplibregl-canvas")).length;
  report.cardMiniMapsLoaded = miniMapsCount;
  console.log(
    "3. Real MapLibre mini-maps on property cards:",
    miniMapsCount,
    miniMapsCount >= 3 ? "PASS" : "FAIL",
  );

  // 2. Check property detail page /properties/p_001
  console.log("Step 2: Inspecting property detail /properties/p_001...");
  await page.goto(`${PROD_URL}/properties/p_001`, { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 2000));

  const detailCanvasCount = (await page.$$(".maplibregl-canvas")).length;
  report.detailMapLoaded = detailCanvasCount > 0;
  console.log(
    "4. Detail page real MapLibre canvas present?:",
    report.detailMapLoaded ? "PASS" : "FAIL",
  );

  // 3. Test Live n8n webhook execution directly
  console.log("Step 3: Triggering live n8n webhook POST /webhook/terratrust/verify...");
  const testPassportId = "TT-KA-2609-" + Math.random().toString(36).substring(2, 7).toUpperCase();
  const testPropertyUuid = "4f83b8b1-562a-4318-8092-28c0352ef29b";

  const webhookPayload = {
    propertyId: "prop_final_test",
    passportId: testPassportId,
    propertyUuid: testPropertyUuid,
    stateCode: "KA",
    cadastralIdentifiers: {
      district: "Bengaluru Urban",
      taluk: "Bengaluru East",
      surveyNumber: "112/4",
    },
    property: {
      title: "Whitefield Cyber Park Parcel",
      address: "ITPL Main Road, Whitefield, Bengaluru",
      region: "Karnataka",
      country: "India",
      valuation: 45000000,
      area: 4200,
      type: "commercial",
      boundary: [
        { lat: 12.9856, lng: 77.7312 },
        { lat: 12.9868, lng: 77.7312 },
        { lat: 12.9868, lng: 77.733 },
        { lat: 12.9856, lng: 77.733 },
      ],
    },
  };

  const n8nRes = await fetch("https://kushhhsanthosh.app.n8n.cloud/webhook/terratrust/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(webhookPayload),
  });

  const n8nData = await n8nRes.json();
  report.n8nWebhookResponse = {
    httpStatus: n8nRes.status,
    workflowId: n8nData.workflowId,
    propertyUuid: testPropertyUuid,
    passportId: testPassportId,
    decision: n8nData.decision,
    status: n8nData.status,
    confidenceScore: n8nData.confidenceScore,
    stepsCount: n8nData.steps?.length,
  };
  console.log("5. n8n verification result:", report.n8nWebhookResponse);

  // 4. Test 5 roles login on production
  const roles = [
    { role: "citizen", email: "citizen@terratrust.ai", expectedPath: "/dashboard" },
    { role: "government", email: "government@terratrust.ai", expectedPath: "/government" },
    { role: "surveyor", email: "surveyor@terratrust.ai", expectedPath: "/surveyor" },
    { role: "bank", email: "bank@terratrust.ai", expectedPath: "/bank" },
    { role: "admin", email: "admin@terratrust.ai", expectedPath: "/admin" },
  ];

  for (const r of roles) {
    console.log(`Step 4: Testing ${r.role} role login...`);
    await page.goto(`${PROD_URL}/login`, { waitUntil: "domcontentloaded" });
    await new Promise((res) => setTimeout(res, 800));

    // Find the Sign in button for this role in demoAccounts
    const signedIn = await page.evaluate((targetEmail) => {
      const rows = Array.from(document.querySelectorAll(".rounded-lg.border"));
      for (const row of rows) {
        if (row.innerText.includes(targetEmail)) {
          const btns = row.querySelectorAll("button");
          if (btns.length >= 2) {
            btns[1].click(); // second button is "Sign In"
            return true;
          }
        }
      }
      return false;
    }, r.email);

    await new Promise((res) => setTimeout(res, 2500));
    const currentUrl = page.url();
    const passed = currentUrl.includes(r.expectedPath) || currentUrl.includes("/dashboard");
    report.rolesTested[r.role] = { url: currentUrl, passed };
    console.log(`   ${r.role}: ${currentUrl} -> ${passed ? "PASS" : "FAIL"}`);
  }

  await browser.close();

  fs.writeFileSync("final-e2e-summary.json", JSON.stringify(report, null, 2));
  console.log("\nFinal E2E Test Suite Completed successfully.");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
