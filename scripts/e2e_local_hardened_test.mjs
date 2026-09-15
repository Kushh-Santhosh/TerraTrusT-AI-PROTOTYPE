import puppeteer from "puppeteer-core";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const LOCAL_URL = "http://localhost:3000";

const envContent = fs.readFileSync(".env.local", "utf8");
const env = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[match[1].trim()] = val;
  }
}

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON = env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

async function runTests() {
  console.log("=================================================================");
  console.log("  TERRATRUST AI — END-TO-END LOCAL HARDENING & ROLE TEST SUITE   ");
  console.log("=================================================================\n");

  const testResults = {
    backButtonProtected: false,
    citizenAccess: false,
    citizenBlockedFromSurveyor: false,
    citizenBlockedFromBank: false,
    citizenAllowedPropertiesNew: false,
    surveyorAccess: false,
    surveyorBlockedPropertiesNew: false,
    bankAccess: false,
    bankBlockedPropertiesNew: false,
    governmentAccess: false,
    adminAccess: false,
    databaseUniquenessCheck: false,
  };

  // 1. Database Duplicate Identifier Verification
  console.log("--- TEST 1: Database State Identifier Uniqueness & Rejection ---");
  const dummyState = "Karnataka";
  const dummyType = "e-Khata / PID";
  const dummyVal = "TEST_PID_" + Date.now();

  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: env.DEMO_CITIZEN_EMAIL,
    password: env.DEMO_CITIZEN_PASSWORD,
  });

  if (authErr || !authData.user) {
    console.error("Failed to authenticate as citizen for DB test:", authErr?.message);
  } else {
    const ownerId = authData.user.id;
    const { data: insert1, error: err1 } = await supabase
      .from("properties")
      .insert({
        owner_id: ownerId,
        passport_id: "TT-KA-TEST-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
        property_name: "State Identifier Test Parcel 1",
        area: 1200,
        property_state: dummyState,
        record_identifier_type: dummyType,
        record_identifier_value: dummyVal,
        status: "pending",
      })
      .select()
      .single();

    if (err1) {
      console.error("Failed initial insert:", err1.message);
    } else {
      console.log("   ✓ First property with identifier created:", insert1.id);

      // Attempt second insert with identical state & identifier
      const { data: insert2, error: err2 } = await supabase
        .from("properties")
        .insert({
          owner_id: ownerId,
          passport_id: "TT-KA-TEST-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
          property_name: "Duplicate Identifier Attempt",
          area: 1400,
          property_state: dummyState,
          record_identifier_type: dummyType,
          record_identifier_value: dummyVal,
          status: "pending",
        })
        .select()
        .single();

      if (
        err2 &&
        (err2.code === "23505" ||
          err2.message.includes("unique constraint") ||
          err2.message.includes("idx_properties_state_identifier"))
      ) {
        console.log(
          "   ✓ Duplicate identifier successfully rejected by Postgres unique index (code 23505)!",
        );
        testResults.databaseUniquenessCheck = true;
      } else {
        console.error("   ✗ Expected 23505 duplicate rejection, got:", err2 || insert2);
      }

      // Clean up test record
      await supabase.from("properties").delete().eq("id", insert1.id);
      console.log("   ✓ Cleaned up test property record");
    }
  }

  // Launch browser for UI tests
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.text().includes("error") || msg.text().includes("Failed")) {
      console.log("   [PAGE LOG]", msg.text());
    }
  });

  async function cleanSignOut() {
    try {
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      const client = await page.target().createCDPSession();
      await client.send("Network.clearBrowserCookies");
    } catch {}
    await page.goto(`${LOCAL_URL}/login`, { waitUntil: "domcontentloaded" });
    await new Promise((r) => setTimeout(r, 1000));
  }

  // Helper function to sign in using demo account button
  async function signInRole(roleName, expectedPath) {
    await page.goto(`${LOCAL_URL}/login`, { waitUntil: "domcontentloaded" });
    await new Promise((r) => setTimeout(r, 1200));

    const btnSelector = `#test-login-demo-${roleName}`;
    await page.waitForSelector(btnSelector, { timeout: 8000 });
    await page.click(btnSelector);

    // Poll until expected path is reached or 6 seconds pass
    for (let i = 0; i < 20; i++) {
      if (page.url().includes(expectedPath)) break;
      await new Promise((r) => setTimeout(r, 300));
    }
    await new Promise((r) => setTimeout(r, 800));
  }

  // --- TEST 2: Citizen Login & Back Button Test ---
  console.log("\n--- TEST 2: Citizen Login & Back-Button Protection ---");
  await signInRole("citizen", "/dashboard");
  let currentUrl = page.url();
  console.log("   After citizen sign in, URL is:", currentUrl);
  if (currentUrl.includes("/dashboard")) {
    testResults.citizenAccess = true;
    console.log("   ✓ Citizen landed on /dashboard");
  }

  // Test Back Button
  console.log("   Testing browser BACK button navigation...");
  await page.goBack();
  await new Promise((r) => setTimeout(r, 2000));
  const urlAfterBack = page.url();
  const pageContent = await page.content();
  const loginFormVisible =
    pageContent.includes("Welcome back") &&
    pageContent.includes("Sign In") &&
    !pageContent.includes("Redirecting");
  console.log("   URL after goBack():", urlAfterBack);
  console.log(
    "   Is unauthenticated login form exposed?:",
    loginFormVisible ? "YES (FAIL)" : "NO (PASS)",
  );

  if (!loginFormVisible || urlAfterBack.includes("/dashboard")) {
    testResults.backButtonProtected = true;
    console.log(
      "   ✓ Back button protection verified: Authenticated session preserved, login form blocked",
    );
  }

  // --- TEST 3: Citizen Role Boundaries ---
  console.log("\n--- TEST 3: Citizen Role Protection on Restricted Routes ---");
  // Attempt to access /surveyor directly
  await page.goto(`${LOCAL_URL}/surveyor`, { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 2000));
  let surveyorContent = await page.content();
  if (surveyorContent.includes("Access Restricted") && surveyorContent.includes("surveyor")) {
    testResults.citizenBlockedFromSurveyor = true;
    console.log('   ✓ Citizen blocked from /surveyor with "Access Restricted"');
  } else {
    console.log("   ✗ Citizen was not blocked from /surveyor");
  }

  // Attempt to access /bank directly
  await page.goto(`${LOCAL_URL}/bank`, { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 2000));
  let bankContent = await page.content();
  if (bankContent.includes("Access Restricted") && bankContent.includes("bank")) {
    testResults.citizenBlockedFromBank = true;
    console.log('   ✓ Citizen blocked from /bank with "Access Restricted"');
  } else {
    console.log("   ✗ Citizen was not blocked from /bank");
  }

  // Citizen visits /properties/new
  await page.goto(`${LOCAL_URL}/properties/new`, { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 3000));
  let propNewContent = await page.content();
  console.log("   /properties/new page title or snippet:", propNewContent.slice(0, 400));
  if (
    !propNewContent.includes("Access Restricted") &&
    (propNewContent.includes("State & Land Record") ||
      propNewContent.includes("Register Property") ||
      propNewContent.includes("Jurisdiction"))
  ) {
    testResults.citizenAllowedPropertiesNew = true;
    console.log("   ✓ Citizen successfully allowed into /properties/new wizard");
  } else {
    console.log(
      "   ✗ Citizen could not access /properties/new, includes Access Restricted?:",
      propNewContent.includes("Access Restricted"),
    );
  }

  // --- TEST 4: Surveyor QA Login & Restrictions ---
  console.log("\n--- TEST 4: Surveyor QA Login & Restrictions ---");
  await cleanSignOut();
  await signInRole("surveyor", "/surveyor");
  currentUrl = page.url();
  console.log("   After surveyor sign in, URL is:", currentUrl);
  if (currentUrl.includes("/surveyor")) {
    testResults.surveyorAccess = true;
    console.log("   ✓ Surveyor landed on /surveyor workspace");
  }

  // Surveyor attempts /properties/new
  await page.goto(`${LOCAL_URL}/properties/new`, { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 2000));
  let surveyorPropNew = await page.content();
  if (surveyorPropNew.includes("Access Restricted") && surveyorPropNew.includes("citizen")) {
    testResults.surveyorBlockedPropertiesNew = true;
    console.log('   ✓ Surveyor correctly blocked from /properties/new ("Access Restricted")');
  } else {
    console.log("   ✗ Surveyor was not blocked from /properties/new");
  }

  // --- TEST 5: Bank QA Login & Restrictions ---
  console.log("\n--- TEST 5: Bank QA Login & Restrictions ---");
  await cleanSignOut();
  await signInRole("bank", "/bank");
  currentUrl = page.url();
  console.log("   After bank sign in, URL is:", currentUrl);
  if (currentUrl.includes("/bank")) {
    testResults.bankAccess = true;
    console.log("   ✓ Bank landed on /bank workspace");
  }

  // Bank attempts /properties/new
  await page.goto(`${LOCAL_URL}/properties/new`, { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 2000));
  let bankPropNew = await page.content();
  if (bankPropNew.includes("Access Restricted") && bankPropNew.includes("citizen")) {
    testResults.bankBlockedPropertiesNew = true;
    console.log('   ✓ Bank correctly blocked from /properties/new ("Access Restricted")');
  } else {
    console.log("   ✗ Bank was not blocked from /properties/new");
  }

  // --- TEST 6: Government QA Login ---
  console.log("\n--- TEST 6: Government QA Login ---");
  await cleanSignOut();
  await signInRole("government", "/government");
  currentUrl = page.url();
  console.log("   After government sign in, URL is:", currentUrl);
  if (currentUrl.includes("/government")) {
    testResults.governmentAccess = true;
    console.log("   ✓ Government landed on /government workspace");
  }

  // --- TEST 7: Admin QA Login ---
  console.log("\n--- TEST 7: Admin QA Login ---");
  await cleanSignOut();
  await signInRole("admin", "/admin");
  currentUrl = page.url();
  console.log("   After admin sign in, URL is:", currentUrl);
  if (currentUrl.includes("/admin")) {
    testResults.adminAccess = true;
    console.log("   ✓ Admin landed on /admin workspace");
  }

  await browser.close();

  console.log("\n=================================================================");
  console.log("                      TEST SUITE SUMMARY                         ");
  console.log("=================================================================");
  console.table(testResults);

  const allPassed = Object.values(testResults).every(Boolean);
  if (allPassed) {
    console.log("\n🎉 ALL 12 INTEGRATION & ROLE TESTS PASSED SUCCESSFULLY!\n");
    process.exit(0);
  } else {
    console.log("\n⚠️ SOME TESTS FAILED. See breakdown above.\n");
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Fatal error during E2E test runner:", err);
  process.exit(1);
});
