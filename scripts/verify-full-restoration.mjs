import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE_URL = "http://localhost:3000";
const SCREENSHOTS_DIR = path.resolve("./screenshots/restoration");
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

async function verifyAll() {
  console.log("--- Connecting or Launching Chrome for Desktop Website Verification ---");
  let browser;
  try {
    browser = await puppeteer.connect({
      browserURL: "http://127.0.0.1:9222",
      defaultViewport: { width: 1440, height: 900 },
    });
    console.log("Connected to existing Chrome instance on port 9222");
  } catch (err) {
    console.log("Launching new Chrome instance...");
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      defaultViewport: { width: 1440, height: 900 },
    });
  }

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const routesToTest = [
    { path: "/dashboard", name: "01_dashboard" },
    { path: "/properties", name: "02_properties" },
    { path: "/properties/p_001", name: "03_property_detail" },
    { path: "/properties/p_001/ai-analysis", name: "04_property_ai_analysis" },
    { path: "/properties/p_001/boundary", name: "05_property_boundary" },
    { path: "/properties/p_001/documents", name: "06_property_documents" },
    { path: "/properties/p_001/gis-layers", name: "07_property_gis_layers" },
    { path: "/properties/p_001/satellite", name: "08_property_satellite" },
    { path: "/properties/p_001/timeline", name: "09_property_timeline" },
    { path: "/properties/p_001/verify", name: "09b_property_verify" },
    { path: "/ai", name: "10_ai_overview" },
    { path: "/ai-valuation", name: "11_ai_valuation" },
    { path: "/ai-ocr", name: "12_ai_ocr" },
    { path: "/ai-fraud", name: "13_ai_fraud" },
    { path: "/ai-risk", name: "14_ai_risk" },
    { path: "/ai-boundary", name: "15_ai_boundary" },
    { path: "/surveyor", name: "16_surveyor_workspace" },
    { path: "/government", name: "17_government_registry" },
    { path: "/bank", name: "18_bank_portal" },
    { path: "/analytics", name: "19_platform_analytics" },
    { path: "/impact", name: "20_impact_dashboard" },
    { path: "/admin", name: "21_admin_operations" },
  ];

  const results = [];

  for (const r of routesToTest) {
    const url = `${BASE_URL}${r.path}`;
    try {
      const resp = await page.goto(url, { waitUntil: "networkidle2", timeout: 10000 });
      await new Promise((res) => setTimeout(res, 800));
      const ssPath = path.join(SCREENSHOTS_DIR, `${r.name}.png`);
      await page.screenshot({ path: ssPath });
      const status = resp ? resp.status() : "loaded";
      console.log(`[PASS] ${r.path} -> ${status} (saved ${r.name}.png)`);
      results.push({ route: r.path, status: "PASS", code: status });
    } catch (e) {
      console.error(`[FAIL] ${r.path}: ${e.message}`);
      results.push({ route: r.path, status: "FAIL", error: e.message });
    }
  }

  await page.close();
  console.log("\n--- VERIFICATION SUMMARY ---");
  console.table(results);
}

verifyAll().catch((err) => {
  console.error("Test runner fatal error:", err);
  process.exit(1);
});
