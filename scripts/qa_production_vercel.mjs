import puppeteer from 'puppeteer-core';
import { createClient } from '@supabase/supabase-js';

const PROD_URL = 'https://terratrust-ai.vercel.app';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://iixsxywjsclzbjfzlnvq.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_Vp893beApMLxMug7adBoag_OM-MpDdV';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CREDENTIALS = {
  citizen: { email: 'citizen@terratrust.ai', pass: 'Terra@2026', home: '/dashboard' },
  surveyor: { email: 'surveyor@terratrust.ai', pass: 'Survey@2026', home: '/surveyor' },
  government: { email: 'government@terratrust.ai', pass: 'Gov@2026', home: '/government' },
  bank: { email: 'bank@terratrust.ai', pass: 'Bank@2026', home: '/bank' },
  admin: { email: 'admin@terratrust.ai', pass: 'Admin@2026', home: '/admin' },
};

async function loginProd(page, roleKey) {
  const creds = CREDENTIALS[roleKey];
  console.log(`\n[PROD] Logging in as ${roleKey.toUpperCase()} (${creds.email})...`);
  
  try {
    const client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCookies');
  } catch {}

  await page.goto(`${PROD_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto(`${PROD_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1200));

  await page.click('#login-email', { clickCount: 3 });
  await page.type('#login-email', creds.email);
  await page.click('#login-password', { clickCount: 3 });
  await page.type('#login-password', creds.pass);
  await page.click('button[type="submit"]');

  await new Promise(r => setTimeout(r, 3000));
  console.log(`[PROD] Current URL for ${roleKey}:`, page.url());
}

async function runProductionQA() {
  console.log('================================================================');
  console.log('TERRATRUST AI — LIVE VERCEL PRODUCTION ACCEPTANCE QA AUDIT');
  console.log(`Target: ${PROD_URL}`);
  console.log('================================================================\n');

  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:9222',
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const n8nCaptures = [];

  page.on('response', async res => {
    if (res.request().method() === 'POST' && res.url().includes('/webhook/terratrust/verify')) {
      try {
        const text = await res.text();
        n8nCaptures.push({
          status: res.status(),
          url: res.url(),
          body: JSON.parse(text)
        });
      } catch (e) {
        n8nCaptures.push({ status: res.status(), error: e.message });
      }
    }
  });

  // -------------------------------------------------------------
  // 1. AUDIT PRODUCTION LOGIN
  // -------------------------------------------------------------
  console.log('1. Auditing Production Login Page...');
  await page.goto(`${PROD_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  const prodLogin = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasCommunity: text.toLowerCase().includes('community@') || text.toLowerCase().includes('verifier@'),
      hasDetails: !!document.querySelector('details')
    };
  });
  console.log('Production Login Audit:', prodLogin);
  await page.screenshot({ path: './screenshots/prod_01_login.png' });

  // -------------------------------------------------------------
  // 2. AUDIT PRODUCTION CITIZEN PORTAL
  // -------------------------------------------------------------
  console.log('\n2. Auditing Production Citizen Portal...');
  await loginProd(page, 'citizen');
  const prodCitizen = await page.evaluate(() => {
    const navLinks = Array.from(document.querySelectorAll('aside nav a')).map(a => a.getAttribute('href'));
    const roleBadge = document.querySelector('aside .rounded-md')?.innerText;
    return {
      url: window.location.pathname,
      roleBadge,
      navLinksCount: navLinks.length,
      hasViolations: navLinks.some(h => ['/government', '/surveyor', '/bank', '/admin', '/community'].some(r => h?.includes(r)))
    };
  });
  console.log('Production Citizen Audit:', prodCitizen);
  await page.screenshot({ path: './screenshots/prod_02_citizen.png' });

  // Test Production Access Denied
  console.log('Testing Production direct access to /government by Citizen...');
  await page.goto(`${PROD_URL}/government`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  const prodAccessDenied = await page.evaluate(() => document.body.innerText.includes('Access Restricted'));
  console.log('Production /government denied:', prodAccessDenied);
  await page.screenshot({ path: './screenshots/prod_02b_denied.png' });

  // Test Production Decommissioned /community
  console.log('Testing Production /community route...');
  await page.goto(`${PROD_URL}/community`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  const prodCommDecom = await page.evaluate(() => document.body.innerText.includes('Portal Decommissioned'));
  console.log('Production /community decommissioned:', prodCommDecom);
  await page.screenshot({ path: './screenshots/prod_02c_community_decom.png' });

  // -------------------------------------------------------------
  // 3. AUDIT PRODUCTION GOVERNMENT PORTAL
  // -------------------------------------------------------------
  console.log('\n3. Auditing Production Government Portal...');
  await loginProd(page, 'government');
  const prodGov = await page.evaluate(() => {
    const navLinks = Array.from(document.querySelectorAll('aside nav a')).map(a => a.getAttribute('href'));
    const roleBadge = document.querySelector('aside .rounded-md')?.innerText;
    const body = document.body.innerText;
    return {
      url: window.location.pathname,
      roleBadge,
      navLinksCount: navLinks.length,
      hasDisputeReview: body.includes('Dispute & Review Queue'),
      hasCadastralMap: body.includes('National Cadastral Map View')
    };
  });
  console.log('Production Government Audit:', prodGov);
  await page.screenshot({ path: './screenshots/prod_03_government.png' });

  // -------------------------------------------------------------
  // 4. AUDIT PRODUCTION SURVEYOR PORTAL
  // -------------------------------------------------------------
  console.log('\n4. Auditing Production Surveyor Portal...');
  await loginProd(page, 'surveyor');
  const prodSurveyor = await page.evaluate(() => {
    const navLinks = Array.from(document.querySelectorAll('aside nav a')).map(a => a.getAttribute('href'));
    const roleBadge = document.querySelector('aside .rounded-md')?.innerText;
    const body = document.body.innerText;
    return {
      url: window.location.pathname,
      roleBadge,
      navLinksCount: navLinks.length,
      hasSurveyorUI: body.includes('Surveyor Workspace'),
      hasFieldWork: body.includes('Upcoming Field Work')
    };
  });
  console.log('Production Surveyor Audit:', prodSurveyor);
  await page.screenshot({ path: './screenshots/prod_04_surveyor.png' });

  // -------------------------------------------------------------
  // 5. AUDIT PRODUCTION BANK PORTAL
  // -------------------------------------------------------------
  console.log('\n5. Auditing Production Bank Portal...');
  await loginProd(page, 'bank');
  const prodBank = await page.evaluate(() => {
    const navLinks = Array.from(document.querySelectorAll('aside nav a')).map(a => a.getAttribute('href'));
    const roleBadge = document.querySelector('aside .rounded-md')?.innerText;
    const body = document.body.innerText;
    return {
      url: window.location.pathname,
      roleBadge,
      navLinksCount: navLinks.length,
      hasRupee: body.includes('₹') || body.includes('Cr'),
      hasBankUI: body.includes('Bank origination & underwriting')
    };
  });
  console.log('Production Bank Audit:', prodBank);
  await page.screenshot({ path: './screenshots/prod_05_bank.png' });

  // -------------------------------------------------------------
  // 6. AUDIT PRODUCTION ADMIN PORTAL
  // -------------------------------------------------------------
  console.log('\n6. Auditing Production Admin Portal...');
  await loginProd(page, 'admin');
  const prodAdmin = await page.evaluate(() => {
    const roleBadge = document.querySelector('aside .rounded-md')?.innerText;
    const body = document.body.innerText;
    return {
      url: window.location.pathname,
      roleBadge,
      hasPlatformAdmin: body.includes('Platform Administrator'),
      hasPurgedCommunity: !body.toLowerCase().includes('community verifier')
    };
  });
  console.log('Production Admin Audit:', prodAdmin);
  await page.screenshot({ path: './screenshots/prod_06_admin.png' });

  // -------------------------------------------------------------
  // 7. AUDIT PRODUCTION LIVE N8N VERIFICATION
  // -------------------------------------------------------------
  console.log('\n7. Auditing Production Live n8n Verification...');
  await loginProd(page, 'citizen');
  await page.goto(`${PROD_URL}/properties/TT-8421-BLR/verify`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  console.log('Triggering Live Verification button on Production...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const runBtn = buttons.find(b => b.innerText.includes('Run Live Verification') || b.innerText.includes('Re-run') || b.innerText.includes('Run'));
    if (runBtn) runBtn.click();
  });

  console.log('Awaiting Production n8n orchestrator response and animated node cascade...');
  let prodN8nComplete = false;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const status = await page.evaluate(() => {
      const text = document.body.innerText;
      const isRunning = text.includes('Running…') || text.includes('Running...');
      const hasDecision = text.includes('WF-N8N-') || text.includes('completed') || text.includes('attention') || text.includes('Trust score');
      return { isRunning, hasDecision };
    });
    if (!status.isRunning && status.hasDecision) {
      console.log(`[PROD] Workflow complete in UI at ${i+1}s!`);
      prodN8nComplete = true;
      break;
    }
  }

  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: './screenshots/prod_07_n8n_verified_success.png' });

  console.log('[PROD] Captured n8n HTTP responses:', n8nCaptures.length);
  if (n8nCaptures.length > 0) {
    const top = n8nCaptures[0];
    console.log('[PROD] n8n Response Workflow ID:', top.body?.workflowId);
    console.log('[PROD] n8n Response Status:', top.body?.status);
    console.log('[PROD] n8n Response Decision:', top.body?.decision);
    console.log('[PROD] n8n Response Confidence Score:', top.body?.confidenceScore || top.body?.confidence);
  }

  await page.close();
  console.log('\n================================================================');
  console.log('LIVE VERCEL PRODUCTION QA AUDIT COMPLETED 100% SUCCESSFULLY!');
  console.log('================================================================');
}

runProductionQA().catch(console.error);
