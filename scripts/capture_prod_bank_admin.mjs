import puppeteer from 'puppeteer-core';

const PROD_URL = 'https://terratrust-ai.vercel.app';

async function captureBankAndAdmin() {
  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:9222',
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Bank
  console.log('Capturing Bank portal...');
  await page.goto(`${PROD_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  const client = await page.target().createCDPSession();
  await client.send('Network.clearBrowserCookies');
  await page.goto(`${PROD_URL}/login`, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1000));
  await page.click('#login-email', { clickCount: 3 });
  await page.type('#login-email', 'bank@terratrust.ai');
  await page.click('#login-password', { clickCount: 3 });
  await page.type('#login-password', 'Bank@2026');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 3500));
  await page.screenshot({ path: './screenshots/prod_05_bank.png' });
  console.log('Bank captured at:', page.url());

  // Admin
  console.log('Capturing Admin portal...');
  await client.send('Network.clearBrowserCookies');
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.goto(`${PROD_URL}/login`, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1000));
  await page.click('#login-email', { clickCount: 3 });
  await page.type('#login-email', 'admin@terratrust.ai');
  await page.click('#login-password', { clickCount: 3 });
  await page.type('#login-password', 'Admin@2026');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 3500));
  await page.screenshot({ path: './screenshots/prod_06_admin.png' });
  console.log('Admin captured at:', page.url());

  await page.close();
}

captureBankAndAdmin().catch(console.error);
