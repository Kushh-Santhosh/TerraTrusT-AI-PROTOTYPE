import puppeteer from "puppeteer-core";
import fs from "fs";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE_URL = "http://localhost:3000";

const rolesToTest = [
  {
    role: "admin",
    user: {
      id: "demo_admin_user",
      email: "admin@terratrust.ai",
      role: "admin",
      full_name: "System Administrator",
      region: "Karnataka",
    },
    startUrl: `${BASE_URL}/admin`,
    expectedH1: "Platform Administrator",
  },
  {
    role: "surveyor",
    user: {
      id: "demo_surveyor_user",
      email: "surveyor@terratrust.ai",
      role: "surveyor",
      full_name: "Arjun Mehta",
      region: "Karnataka",
    },
    startUrl: `${BASE_URL}/surveyor`,
    expectedH1: "Surveyor Field Operations",
  },
  {
    role: "government",
    user: {
      id: "demo_government_user",
      email: "government@terratrust.ai",
      role: "government",
      full_name: "Dr. Vandana Rao",
      region: "Karnataka",
    },
    startUrl: `${BASE_URL}/government`,
    expectedH1: "Government Land Registry",
  },
  {
    role: "bank",
    user: {
      id: "demo_bank_user",
      email: "bank@terratrust.ai",
      role: "bank",
      full_name: "Sunita Sharma",
      region: "Karnataka",
    },
    startUrl: `${BASE_URL}/bank`,
    expectedH1: "Institutional Lending",
  },
  {
    role: "citizen",
    user: {
      id: "demo_citizen_user",
      email: "citizen@terratrust.ai",
      role: "citizen",
      full_name: "Kushal Santhosh",
      region: "Karnataka",
    },
    startUrl: `${BASE_URL}/dashboard`,
    expectedH1: "Welcome back, Kushal Santhosh",
  },
];

async function runClickMatrix() {
  console.log("===============================================================");
  console.log("  TERRATRUST AI — COMPREHENSIVE CLICK NAVIGATION MATRIX TEST   ");
  console.log("===============================================================\n");

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"],
  });

  fs.mkdirSync("screenshots/click_matrix", { recursive: true });

  const summary = {};

  for (const item of rolesToTest) {
    console.log(`\n>>> STARTING ROLE: ${item.role.toUpperCase()} <<<`);
    summary[item.role] = { total: 0, passed: 0, failed: 0, items: [] };

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Set demo session in localStorage before document loads
    await page.evaluateOnNewDocument((userData) => {
      localStorage.setItem("terratrust_demo_session", JSON.stringify(userData));
    }, item.user);

    await page.goto(item.startUrl, { waitUntil: "domcontentloaded" });
    await new Promise((r) => setTimeout(r, 1200));

    // Get all navigation links in the sidebar for this role
    const links = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll("aside nav a"));
      return elements
        .map((a) => ({
          href: a.getAttribute("href"),
          label: a.innerText.trim().split("\n")[0],
        }))
        .filter((l) => l.href);
    });

    console.log(`Found ${links.length} visible sidebar links for ${item.role}.`);

    for (const link of links) {
      summary[item.role].total++;

      // Click the link via DOM click
      const clicked = await page.evaluate((targetHref) => {
        const el = document.querySelector(`aside nav a[href="${targetHref}"]`);
        if (el) {
          el.click();
          return true;
        }
        return false;
      }, link.href);

      await new Promise((r) => setTimeout(r, 900));

      const currentUrl = page.url();
      const currentH1 = await page
        .$eval("h1", (el) => el.innerText.trim())
        .catch(() => "NO_H1_FOUND");
      const hasError = await page.evaluate(() => {
        const bodyText = document.body.innerText;
        return bodyText.includes("Something went wrong") || bodyText.includes("Error 404");
      });

      const urlPass = currentUrl.endsWith(link.href) || currentUrl.includes(link.href);
      const pass = urlPass && !hasError && currentH1 !== "NO_H1_FOUND";

      if (pass) {
        summary[item.role].passed++;
        console.log(
          `  [PASS] Clicked "${link.label}" (${link.href}) -> URL: ${currentUrl} | H1: "${currentH1}"`,
        );
      } else {
        summary[item.role].failed++;
        console.log(
          `  [FAIL] Clicked "${link.label}" (${link.href}) -> URL: ${currentUrl} | H1: "${currentH1}" | Error: ${hasError}`,
        );
      }

      summary[item.role].items.push({
        label: link.label,
        href: link.href,
        actualUrl: currentUrl,
        heading: currentH1,
        status: pass ? "PASS" : "FAIL",
      });
    }

    // Capture screenshot of the last visited view for this role
    const screenshotName = `screenshots/click_matrix/${item.role}_final.png`;
    await page.screenshot({ path: screenshotName });
    console.log(`Saved screenshot: ${screenshotName}`);

    await page.close();
  }

  await browser.close();

  fs.writeFileSync("screenshots/click_matrix/results.json", JSON.stringify(summary, null, 2));

  console.log("\n===============================================================");
  console.log("  TEST SUMMARY ACROSS ALL 5 ROLES:");
  for (const [r, res] of Object.entries(summary)) {
    console.log(`  - ${r.toUpperCase()}: ${res.passed}/${res.total} PASS (Failed: ${res.failed})`);
  }
  console.log("===============================================================\n");
}

runClickMatrix().catch((e) => {
  console.error("Test matrix error:", e);
  process.exit(1);
});
