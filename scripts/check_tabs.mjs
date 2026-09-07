import puppeteer from 'puppeteer-core';

async function check() {
  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
  try {
    const pages = await browser.pages();
    for (const p of pages) {
      console.log(`Page: ${await p.title()} | URL: ${p.url()}`);
    }
  } finally {
    browser.disconnect();
  }
}

check().catch(console.error);
