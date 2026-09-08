import puppeteer from "puppeteer-core";
import fs from "fs";

async function run() {
  console.log("Connecting to Chrome on port 9222...");
  const browser = await puppeteer.connect({
    browserURL: "http://127.0.0.1:9222",
    defaultViewport: { width: 1440, height: 900 }
  });

  const pages = await browser.pages();
  const page = pages.find(p => p.url().includes("localhost:3000")) || pages[0] || (await browser.newPage());

  console.log("Navigating to http://localhost:3000/login...");
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle2", timeout: 15000 });

  // Check that DEVELOPMENT TEST ACCOUNTS header is visible
  const devHeader = await page.evaluate(() => {
    return document.body.innerText.includes("DEVELOPMENT TEST ACCOUNTS");
  });
  console.log("DEVELOPMENT TEST ACCOUNTS section present:", devHeader);
  if (!devHeader) {
    throw new Error("DEVELOPMENT TEST ACCOUNTS section not found on /login!");
  }

  const rolesToTest = [
    { name: "Government", id: "#test-login-government", expectedUrl: "/government", roleName: "government" },
    { name: "Surveyor", id: "#test-login-surveyor", expectedUrl: "/surveyor", roleName: "surveyor" },
    { name: "Bank", id: "#test-login-bank", expectedUrl: "/bank", roleName: "bank" },
    { name: "Admin", id: "#test-login-admin", expectedUrl: "/admin", roleName: "admin" },
    { name: "Citizen", id: "#test-login-citizen", expectedUrl: "/dashboard", roleName: "citizen" },
  ];

  for (const role of rolesToTest) {
    console.log(`\n--------------------------------------------------`);
    console.log(`Testing 1-click Sign In as: ${role.name}...`);

    // Ensure we are on /login
    if (!page.url().includes("/login")) {
      await page.goto("http://localhost:3000/login", { waitUntil: "networkidle2" });
    }

    // Wait for the button
    await page.waitForSelector(role.id, { visible: true, timeout: 5000 });
    console.log(`Clicking button ${role.id} ('Sign in as ${role.name}')...`);
    await page.click(role.id);

    // Wait for URL to transition
    console.log(`Waiting for navigation to ${role.expectedUrl}...`);
    await page.waitForFunction((expected) => window.location.pathname.startsWith(expected), { timeout: 10000 }, role.expectedUrl);
    console.log(`Successfully navigated to: ${page.url()}`);

    // Wait for authenticated profile state in React
    await new Promise(r => setTimeout(r, 1500));

    // Verify localStorage has supabase session
    const authState = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      const authKey = keys.find(k => k.includes("auth-token"));
      if (!authKey) return null;
      try {
        const item = JSON.parse(localStorage.getItem(authKey));
        return {
          email: item.user?.email,
          role: item.user?.user_metadata?.role
        };
      } catch {
        return null;
      }
    });
    console.log(`Authenticated user in localStorage:`, authState);

    // Take screenshot
    const screenshotPath = `screenshots/test_account_${role.roleName}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`Saved screenshot to ${screenshotPath}`);

    // Click Sign Out
    console.log("Signing out...");
    const signedOut = await page.evaluate(async () => {
      // Find sign out button
      const buttons = Array.from(document.querySelectorAll("button, a"));
      const signOutBtn = buttons.find(b => b.innerText.toLowerCase().includes("sign out") || b.innerText.toLowerCase().includes("log out"));
      if (signOutBtn) {
        signOutBtn.click();
        return true;
      }
      return false;
    });

    if (signedOut) {
      await new Promise(r => setTimeout(r, 1500));
    } else {
      // Alternatively trigger supabase signout directly or navigate to /login after clearing storage
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await page.goto("http://localhost:3000/login", { waitUntil: "networkidle2" });
    }

    console.log(`Current URL after sign out: ${page.url()}`);
    console.log(`✅ ${role.name} test complete!`);
  }

  console.log("\n==================================================");
  console.log("ALL 5 ROLE ACCOUNTS VERIFIED IN CHROME BROWSER!");
  console.log("==================================================");
}

run().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
