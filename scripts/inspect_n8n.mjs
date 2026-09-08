import puppeteer from 'puppeteer-core';

async function run() {
  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
  try {
    const pages = await browser.pages();
    let n8nPage = pages.find(p => p.url().includes('n8n.cloud'));
    if (!n8nPage) {
      n8nPage = await browser.newPage();
      await n8nPage.goto('https://kushhhsanthosh.app.n8n.cloud/home/workflows', { waitUntil: 'networkidle2' });
    }

    console.log('n8n current URL:', n8nPage.url());

    // Navigate to executions
    await n8nPage.goto('https://kushhhsanthosh.app.n8n.cloud/home/executions', { waitUntil: 'networkidle2' }).catch(() => {});
    await new Promise(r => setTimeout(r, 4000));

    console.log('n8n Executions URL:', n8nPage.url());
    const title = await n8nPage.title();
    console.log('Page Title:', title);

    // Get list of executions from page text / DOM
    const data = await n8nPage.evaluate(() => {
      const items = Array.from(document.querySelectorAll('tr, [data-test-id], [class*="execution"], [class*="card"]'));
      return {
        bodySnippet: document.body.innerText.slice(0, 3000),
        hrefs: Array.from(document.querySelectorAll('a')).map(a => ({ text: a.innerText.trim(), href: a.href })).filter(a => a.href.includes('execution') || a.href.includes('workflow'))
      };
    });

    console.log('Body snippet:\n', data.bodySnippet.slice(0, 1500));
    console.log('Links:\n', JSON.stringify(data.hrefs.slice(0, 20), null, 2));

  } finally {
    browser.disconnect();
  }
}

run().catch(console.error);
