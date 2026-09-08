import puppeteer from 'puppeteer-core';

async function inspectNodeDetail() {
  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
  try {
    const pages = await browser.pages();
    let n8nPage = pages.find(p => p.url().includes('n8n.cloud'));

    const result = await n8nPage.evaluate(async () => {
      // Find node named 'Property Submitted'
      const nodes = Array.from(document.querySelectorAll('*')).filter(el => el.textContent?.trim() === 'Property Submitted');
      if (nodes.length > 0) {
        nodes[0].click();
      }
      await new Promise(r => setTimeout(r, 1200));

      // Click Input tab or look for json text
      return document.body.innerText.slice(0, 5000);
    });

    console.log('Result after clicking Property Submitted:\n', result);

  } finally {
    browser.disconnect();
  }
}

inspectNodeDetail().catch(console.error);
