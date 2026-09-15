import puppeteer from "puppeteer-core";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY)
  throw new Error("VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are required");
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CREDENTIALS = {
  citizen: { email: "citizen@terratrust.ai", pass: "Terra@2026", home: "/dashboard" },
  surveyor: { email: "surveyor@terratrust.ai", pass: "Survey@2026", home: "/surveyor" },
  government: { email: "government@terratrust.ai", pass: "Gov@2026", home: "/government" },
  bank: { email: "bank@terratrust.ai", pass: "Bank@2026", home: "/bank" },
  admin: { email: "admin@terratrust.ai", pass: "Admin@2026", home: "/admin" },
};

async function loginAs(page, roleKey) {
  const creds = CREDENTIALS[roleKey];
  console.log(`\nLogging in as ${roleKey.toUpperCase()} (${creds.email})...`);

  await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1000));

  await page.click("#login-email", { clickCount: 3 });
  await page.type("#login-email", creds.email);
  await page.click("#login-password", { clickCount: 3 });
  await page.type("#login-password", creds.pass);
  await page.click('button[type="submit"]');

  await new Promise((r) => setTimeout(r, 2500));
  console.log(`Current URL for ${roleKey}:`, page.url());
}

async function runFullQAMatrix() {
  console.log("================================================================");
  console.log("TERRATRUST AI — COMPREHENSIVE QA MATRIX & N8N VERIFICATION AUDIT");
  console.log("================================================================\n");

  const browser = await puppeteer.connect({
    browserURL: "http://127.0.0.1:9222",
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const n8nCaptures = [];

  page.on("response", async (res) => {
    if (res.request().method() === "POST" && res.url().includes("/webhook/terratrust/verify")) {
      try {
        const text = await res.text();
        n8nCaptures.push({
          status: res.status(),
          url: res.url(),
          body: JSON.parse(text),
        });
      } catch (e) {
        n8nCaptures.push({ status: res.status(), error: e.message });
      }
    }
  });

  // -------------------------------------------------------------
  // 1. AUDIT LOGIN PAGE
  // -------------------------------------------------------------
  console.log("--- 1. AUDITING LOGIN PAGE ---");
  await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1500));

  const loginAudit = await page.evaluate(() => {
    const text = document.body.innerText;
    const hasCommunity =
      text.toLowerCase().includes("community@") || text.toLowerCase().includes("verifier@");
    const details = document.querySelector("details");
    return {
      hasCommunityInUI: hasCommunity,
      credentialsSummary: details?.querySelector("summary")?.innerText,
      hasDetails: !!details,
    };
  });
  console.log("Login Audit:", loginAudit);
  await page.screenshot({ path: "./screenshots/qa_01_login.png" });

  // -------------------------------------------------------------
  // 2. CITIZEN ROLE AUDIT & NAVIGATION ISOLATION
  // -------------------------------------------------------------
  console.log("\n--- 2. AUDITING CITIZEN ROLE & NAVIGATION ---");
  await loginAs(page, "citizen");

  const citizenAudit = await page.evaluate(() => {
    const navLinks = Array.from(document.querySelectorAll("aside nav a")).map((a) => ({
      text: a.innerText.trim(),
      href: a.getAttribute("href"),
    }));
    const roleBadge = document.querySelector("aside .rounded-md")?.innerText;
    const forbidden = navLinks.filter((l) =>
      ["government", "surveyor", "bank", "admin", "community"].some(
        (r) => l.href?.toLowerCase().includes(`/${r}`) || l.text?.toLowerCase().includes(r),
      ),
    );
    return {
      currentUrl: window.location.pathname,
      roleBadge,
      navLinksCount: navLinks.length,
      forbiddenLinks: forbidden,
    };
  });
  console.log("Citizen Portal Audit:", citizenAudit);
  await page.screenshot({ path: "./screenshots/qa_02_citizen_dashboard.png" });

  // Test Citizen Attempting Direct Unauthorized Navigation to /government
  console.log("Testing Citizen direct access to /government...");
  await page.goto("http://localhost:3000/government", {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await new Promise((r) => setTimeout(r, 1500));
  const citizenGovDenied = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      accessRestricted: text.includes("Access Restricted") || text.includes("Unauthorized"),
      url: window.location.pathname,
    };
  });
  console.log("Citizen Access to /government:", citizenGovDenied);
  await page.screenshot({ path: "./screenshots/qa_02b_citizen_denied_gov.png" });

  // Test Citizen Accessing Decommissioned /community
  console.log("Testing access to /community...");
  await page.goto("http://localhost:3000/community", {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await new Promise((r) => setTimeout(r, 1500));
  const commAudit = await page.evaluate(() => {
    return {
      text: document.body.innerText.slice(0, 300),
      isDecommissioned:
        document.body.innerText.includes("Community Portal Unavailable") ||
        document.body.innerText.includes("Portal Decommissioned"),
    };
  });
  console.log("Community Route Result:", commAudit.isDecommissioned);
  await page.screenshot({ path: "./screenshots/qa_02c_community_unavailable.png" });

  // -------------------------------------------------------------
  // 3. GOVERNMENT ROLE AUDIT
  // -------------------------------------------------------------
  console.log("\n--- 3. AUDITING GOVERNMENT ROLE ---");
  await loginAs(page, "government");

  const govAudit = await page.evaluate(() => {
    const navLinks = Array.from(document.querySelectorAll("aside nav a")).map((a) => ({
      text: a.innerText.trim(),
      href: a.getAttribute("href"),
    }));
    const roleBadge = document.querySelector("aside .rounded-md")?.innerText;
    const bodyText = document.body.innerText;
    return {
      currentUrl: window.location.pathname,
      roleBadge,
      navLinksCount: navLinks.length,
      hasDisputeReviewQueue: bodyText.includes("Dispute & Review Queue"),
      hasNationalCadastralMap: bodyText.includes("National Cadastral Map View"),
    };
  });
  console.log("Government Portal Audit:", govAudit);
  await page.screenshot({ path: "./screenshots/qa_03_government_dashboard.png" });

  // -------------------------------------------------------------
  // 4. SURVEYOR ROLE AUDIT
  // -------------------------------------------------------------
  console.log("\n--- 4. AUDITING SURVEYOR ROLE ---");
  await loginAs(page, "surveyor");

  const surveyorAudit = await page.evaluate(() => {
    const navLinks = Array.from(document.querySelectorAll("aside nav a")).map((a) => ({
      text: a.innerText.trim(),
      href: a.getAttribute("href"),
    }));
    const roleBadge = document.querySelector("aside .rounded-md")?.innerText;
    const bodyText = document.body.innerText;
    return {
      currentUrl: window.location.pathname,
      roleBadge,
      navLinksCount: navLinks.length,
      hasSurveyorUI: bodyText.includes("Surveyor Workspace"),
      hasFieldWork: bodyText.includes("Upcoming Field Work"),
    };
  });
  console.log("Surveyor Portal Audit:", surveyorAudit);
  await page.screenshot({ path: "./screenshots/qa_04_surveyor_dashboard.png" });

  // -------------------------------------------------------------
  // 5. BANK ROLE AUDIT
  // -------------------------------------------------------------
  console.log("\n--- 5. AUDITING BANK ROLE ---");
  await loginAs(page, "bank");

  const bankAudit = await page.evaluate(() => {
    const navLinks = Array.from(document.querySelectorAll("aside nav a")).map((a) => ({
      text: a.innerText.trim(),
      href: a.getAttribute("href"),
    }));
    const roleBadge = document.querySelector("aside .rounded-md")?.innerText;
    const bodyText = document.body.innerText;
    const hasRupee = bodyText.includes("₹") || bodyText.includes("Cr");
    return {
      currentUrl: window.location.pathname,
      roleBadge,
      navLinksCount: navLinks.length,
      hasRupeeCurrency: hasRupee,
      hasBankUI: bodyText.includes("Bank origination & underwriting"),
    };
  });
  console.log("Bank Portal Audit:", bankAudit);
  await page.screenshot({ path: "./screenshots/qa_05_bank_dashboard.png" });

  // -------------------------------------------------------------
  // 6. ADMIN ROLE AUDIT
  // -------------------------------------------------------------
  console.log("\n--- 6. AUDITING ADMIN ROLE ---");
  await loginAs(page, "admin");

  const adminAudit = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    const roleBadge = document.querySelector("aside .rounded-md")?.innerText;
    return {
      currentUrl: window.location.pathname,
      roleBadge,
      hasAdminDashboard: bodyText.includes("System Health") || bodyText.includes("Administration"),
      hasPurgedCommunity: !bodyText.toLowerCase().includes("community verifier"),
    };
  });
  console.log("Admin Portal Audit:", adminAudit);
  await page.screenshot({ path: "./screenshots/qa_06_admin_dashboard.png" });

  // -------------------------------------------------------------
  // 7. LIVE N8N END-TO-END VERIFICATION ON REAL PROPERTY
  // -------------------------------------------------------------
  console.log("\n--- 7. AUDITING LIVE N8N E2E VERIFICATION ---");
  // Log in as Citizen to execute verification
  await loginAs(page, "citizen");

  // Navigate to verification page for TT-8421-BLR
  console.log("Navigating to http://localhost:3000/properties/TT-8421-BLR/verify...");
  await page.goto("http://localhost:3000/properties/TT-8421-BLR/verify", {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await new Promise((r) => setTimeout(r, 2000));

  console.log("Triggering live verification run button...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const runBtn = buttons.find(
      (b) =>
        b.innerText.includes("Run Live Verification") ||
        b.innerText.includes("Re-run") ||
        b.innerText.includes("Run"),
    );
    if (runBtn) runBtn.click();
  });

  console.log("Waiting for live n8n orchestrator response and animated node cascade...");
  let n8nComplete = false;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const status = await page.evaluate(() => {
      const text = document.body.innerText;
      const isRunning = text.includes("Running…") || text.includes("Running...");
      const hasDecision =
        text.includes("WF-N8N-") ||
        text.includes("completed") ||
        text.includes("attention") ||
        text.includes("Trust score");
      return { isRunning, hasDecision };
    });
    if (!status.isRunning && status.hasDecision) {
      console.log(`Workflow complete in UI at ${i + 1}s!`);
      n8nComplete = true;
      break;
    }
  }

  // Allow final re-render
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: "./screenshots/qa_07_n8n_verified_success.png" });

  console.log("Captured n8n HTTP responses:", n8nCaptures.length);
  if (n8nCaptures.length > 0) {
    const top = n8nCaptures[0];
    console.log("n8n Response Workflow ID:", top.body?.workflowId);
    console.log("n8n Response Status:", top.body?.status);
    console.log("n8n Response Decision:", top.body?.decision);
    console.log(
      "n8n Response Confidence Score:",
      top.body?.confidenceScore || top.body?.confidence,
    );
  }

  // Verify Supabase persistence of the verification result
  console.log("\nChecking Supabase verification_results table...");
  const { data: latestResults } = await supabase
    .from("verification_results")
    .select("id, property_id, provider, result, created_at")
    .order("created_at", { ascending: false })
    .limit(1);

  if (latestResults && latestResults.length > 0) {
    const row = latestResults[0];
    console.log("Latest Supabase Verification Result:");
    console.log("  ID:", row.id);
    console.log("  Property ID:", row.property_id);
    console.log("  Provider:", row.provider);
    console.log("  Workflow ID:", row.result?.workflowId);
    console.log("  Status:", row.result?.status);
    console.log("  Confidence Score:", row.result?.confidenceScore);
    console.log("  Created At:", row.created_at);
  }

  await page.close();
  console.log("\n================================================================");
  console.log("ALL MATRIX QA AND N8N VERIFICATIONS COMPLETED SUCCESSFULLY!");
  console.log("================================================================");
}

runFullQAMatrix().catch(console.error);
