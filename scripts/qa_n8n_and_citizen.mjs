import puppeteer from "puppeteer-core";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY)
  throw new Error("VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are required");
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runQATest() {
  console.log("=== STARTING REAL CHROME QA & LIVE N8N VERIFICATION AUDIT ===\n");

  const browser = await puppeteer.connect({
    browserURL: "http://127.0.0.1:9222",
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const networkPostRequests = [];
  const networkPostResponses = [];

  page.on("request", (req) => {
    if (req.method() === "POST" && req.url().includes("/webhook/terratrust/verify")) {
      networkPostRequests.push({
        url: req.url(),
        headers: req.headers(),
        postData: req.postData(),
      });
    }
  });

  page.on("response", async (res) => {
    if (res.request().method() === "POST" && res.url().includes("/webhook/terratrust/verify")) {
      try {
        const body = await res.text();
        networkPostResponses.push({
          status: res.status(),
          url: res.url(),
          headers: res.headers(),
          body: body,
        });
      } catch (e) {
        networkPostResponses.push({ status: res.status(), url: res.url(), error: e.message });
      }
    }
  });

  // -------------------------------------------------------------
  // STEP 1: LOGIN PAGE & DEV CREDENTIALS ISOLATION
  // -------------------------------------------------------------
  console.log("1. Navigating to Login page (http://localhost:3000/login)...");
  await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2000));

  const loginQaDetails = await page.evaluate(() => {
    const details = document.querySelector("details");
    return {
      hasDetails: !!details,
      summaryText: details?.querySelector("summary")?.innerText,
      isOpen: details?.open,
    };
  });
  console.log("Login QA Details state:", loginQaDetails);
  await page.screenshot({ path: "./screenshots/01_login_qa_details_isolated.png" });

  // -------------------------------------------------------------
  // STEP 2: LOG IN AS CITIZEN
  // -------------------------------------------------------------
  console.log("2. Signing in as citizen@terratrust.ai...");
  await page.type("#login-email", "citizen@terratrust.ai");
  await page.type("#login-password", "Terra@2026");
  await page.click('button[type="submit"]');

  await new Promise((r) => setTimeout(r, 3000));
  console.log("Current URL after sign in:", page.url());

  // -------------------------------------------------------------
  // STEP 3: AUDIT CITIZEN NAVIGATION ON DASHBOARD
  // -------------------------------------------------------------
  console.log("3. Inspecting Citizen Navigation on Dashboard...");
  await page.goto("http://localhost:3000/dashboard", {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await new Promise((r) => setTimeout(r, 2500));

  const citizenNavAudit = await page.evaluate(() => {
    const navLinks = Array.from(document.querySelectorAll("aside nav a")).map((a) => ({
      text: a.innerText.trim(),
      href: a.getAttribute("href"),
    }));
    const navGroups = Array.from(document.querySelectorAll("aside nav > div > p")).map((p) =>
      p.innerText.trim(),
    );

    // Check if role switcher exists
    const roleSwitcher = !!document.querySelector("aside button svg.lucide-chevron-down");

    // Forbidden terms that must NEVER appear in Citizen navigation
    const forbiddenTerms = [
      "Government",
      "Surveyor",
      "Bank",
      "Admin",
      "Community",
      "/government",
      "/surveyor",
      "/bank",
      "/admin",
      "/community",
    ];
    const violations = navLinks.filter((l) =>
      forbiddenTerms.some(
        (term) =>
          l.href?.toLowerCase().includes(term.toLowerCase()) ||
          l.text?.toLowerCase().includes(term.toLowerCase()),
      ),
    );

    return { navGroups, navLinksCount: navLinks.length, navLinks, violations, roleSwitcher };
  });

  console.log("Citizen Navigation Groups:", citizenNavAudit.navGroups);
  console.log("Citizen Total Nav Links:", citizenNavAudit.navLinksCount);
  console.log("Role Switcher present for Citizen?:", citizenNavAudit.roleSwitcher);
  console.log("Violations in Citizen Navigation:", citizenNavAudit.violations);

  await page.screenshot({ path: "./screenshots/02_citizen_sidebar_cleaned.png" });

  // -------------------------------------------------------------
  // STEP 4: REAL LIVE N8N VERIFICATION EXECUTION IN CHROME
  // -------------------------------------------------------------
  console.log("\n4. Navigating to /properties/p_001/verify for Real Live n8n Verification...");
  await page.goto("http://localhost:3000/properties/p_001/verify", {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await new Promise((r) => setTimeout(r, 3000));

  console.log('5. Clicking "Run Live Verification" in Chrome...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const runBtn = buttons.find(
      (b) => b.innerText.includes("Run Live Verification") || b.innerText.includes("Run"),
    );
    if (runBtn) runBtn.click();
  });

  console.log("6. Awaiting live n8n orchestrator response and animated node completion...");
  let completedInUI = false;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const status = await page.evaluate(() => {
      const text = document.body.innerText;
      return (
        text.includes("WF-N8N-") ||
        text.includes("All verification gates passed") ||
        text.includes("VERIFIED")
      );
    });
    if (status) {
      completedInUI = true;
      console.log(`Live n8n workflow verified in UI at poll ${i + 1}!`);
      break;
    }
  }

  // Allow animated node cascade to complete
  await new Promise((r) => setTimeout(r, 5000));

  const uiData = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    const wfMatch = bodyText.match(/WF-N8N-[A-Z0-9-]+/);
    const scoreMatch = bodyText.match(/(\d+)\s*\/\s*100\s*Trust score/);
    return {
      workflowId: wfMatch ? wfMatch[0] : null,
      trustScore: scoreMatch ? scoreMatch[1] : null,
      hasAuditTrail: bodyText.includes("AUDIT TRAIL"),
      hasVerifiedPill:
        bodyText.includes("Digital Property Passport: Ready to issue") ||
        bodyText.includes("verified"),
      nodesExecutedCount: (bodyText.match(/completed/g) || []).length,
    };
  });
  console.log("UI Verification Outcome:", uiData);

  await page.screenshot({ path: "./screenshots/03_n8n_live_verification_executed.png" });

  // -------------------------------------------------------------
  // STEP 5: AUDIT NETWORK CAPTURE
  // -------------------------------------------------------------
  console.log("\n7. Inspecting Live n8n Network POST & Response...");
  console.log("Captured POST requests to n8n webhook:", networkPostRequests.length);
  if (networkPostRequests.length > 0) {
    const req = networkPostRequests[0];
    console.log("POST URL:", req.url);
    const parsedBody = JSON.parse(req.postData || "{}");
    console.log("Payload Property ID:", parsedBody.propertyId);
    console.log("Payload Passport ID:", parsedBody.passportId);
    console.log("Payload Valuation (INR):", parsedBody.property?.valuationInr);
  }

  console.log("Captured POST responses from n8n webhook:", networkPostResponses.length);
  let parsedN8nResult = null;
  if (networkPostResponses.length > 0) {
    const res = networkPostResponses[0];
    console.log("Response HTTP Status:", res.status);
    try {
      parsedN8nResult = JSON.parse(res.body);
      console.log("Live n8n Response Result:");
      console.log("  workflowId:", parsedN8nResult.workflowId);
      console.log("  propertyId:", parsedN8nResult.propertyId);
      console.log("  passportId:", parsedN8nResult.passportId);
      console.log("  status:", parsedN8nResult.status);
      console.log("  confidenceScore:", parsedN8nResult.confidenceScore);
      console.log("  fraudScore:", parsedN8nResult.fraudScore);
      console.log("  boundaryScore:", parsedN8nResult.boundaryScore);
      console.log("  governmentScore:", parsedN8nResult.governmentScore);
      console.log("  communityScore:", parsedN8nResult.communityScore);
      console.log("  decision:", parsedN8nResult.decision);
      console.log("  valuation:", parsedN8nResult.valuation, parsedN8nResult.currency);
      console.log("  steps count:", parsedN8nResult.steps?.length);
    } catch (e) {
      console.log("Raw response:", res.body);
    }
  }

  // -------------------------------------------------------------
  // STEP 6: AUDIT SUPABASE DATABASE PERSISTENCE
  // -------------------------------------------------------------
  console.log("\n8. Auditing Supabase Database Persistence...");
  const { data: vResults, error: vErr } = await supabase
    .from("verification_results")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(3);

  console.log("Supabase verification_results rows:", vResults ? vResults.length : 0);
  if (vResults && vResults.length > 0) {
    const top = vResults[0];
    console.log("Latest Supabase Verification Result:");
    console.log("  ID:", top.id);
    console.log("  Property ID:", top.property_id);
    console.log("  Provider:", top.provider);
    console.log("  Workflow ID:", top.result?.workflowId);
    console.log("  Status:", top.result?.status);
    console.log("  Confidence Score:", top.result?.confidenceScore);
    console.log("  Valuation (INR):", top.result?.valuation);
    console.log("  Created At:", top.created_at);
  }

  const { data: pData, error: pErr } = await supabase
    .from("properties")
    .select("id, property_name, passport_id, status, trust_score, location, updated_at")
    .eq("passport_id", "TT-8421-BLR")
    .maybeSingle();

  if (pData) {
    console.log("Supabase Property State for TT-8421-BLR:");
    console.log("  ID:", pData.id);
    console.log("  Passport ID:", pData.passport_id);
    console.log("  Status:", pData.status);
    console.log("  Trust Score:", pData.trust_score);
    console.log("  Location Valuation (INR):", pData.location?.estimatedValueInr);
    console.log("  Updated At:", pData.updated_at);
  }

  await page.close();
  console.log("\n=== REAL CHROME QA & N8N VERIFICATION COMPLETE ===");
}

runQATest().catch(console.error);
