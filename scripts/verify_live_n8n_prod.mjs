import puppeteer from "puppeteer-core";

const PROD_URL = "https://terratrust-ai.vercel.app";

async function verifyLiveN8nProd() {
  const browser = await puppeteer.connect({
    browserURL: "http://127.0.0.1:9222",
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log("Logging in as citizen on production...");
  await page.goto(`${PROD_URL}/login`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  const client = await page.target().createCDPSession();
  await client.send("Network.clearBrowserCookies");
  await page.goto(`${PROD_URL}/login`, { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 1000));
  await page.click("#login-email", { clickCount: 3 });
  await page.type("#login-email", "citizen@terratrust.ai");
  await page.click("#login-password", { clickCount: 3 });
  await page.type("#login-password", "Terra@2026");
  await page.click('button[type="submit"]');
  await new Promise((r) => setTimeout(r, 3000));

  console.log("Navigating to verification page on production...");
  await page.goto(`${PROD_URL}/properties/TT-8421-BLR/verify`, { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 2500));

  console.log("Clicking Run Live Verification button...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const btn = buttons.find(
      (b) => b.innerText.includes("Run Live Verification") || b.innerText.includes("Run"),
    );
    if (btn) btn.click();
  });

  console.log("Waiting for n8n orchestrator response and animated node cascade (10s)...");
  await new Promise((r) => setTimeout(r, 10000));

  await page.screenshot({ path: "./screenshots/prod_07_n8n_verified_success.png" });
  console.log("Screenshot saved to ./screenshots/prod_07_n8n_verified_success.png");

  const outcome = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasWfId: text.includes("WF-N8N-"),
      hasTrustScore: text.includes("Trust score"),
      textSnippet: text.slice(0, 500),
    };
  });
  console.log("Live Verification Outcome on Production:", outcome);

  await page.close();
}

verifyLiveN8nProd().catch(console.error);
