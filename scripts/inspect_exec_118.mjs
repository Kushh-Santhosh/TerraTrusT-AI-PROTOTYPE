import puppeteer from 'puppeteer-core';

async function checkExecution118() {
  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
  try {
    const pages = await browser.pages();
    let n8nPage = pages.find(p => p.url().includes('n8n.cloud'));
    if (!n8nPage) {
      n8nPage = await browser.newPage();
    }

    console.log('Navigating to execution 118...');
    await n8nPage.goto('https://kushhhsanthosh.app.n8n.cloud/workflow/2tzD8K0zTU43KzGH/executions/118', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 4000));

    const execData = await n8nPage.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        bodyText: document.body.innerText.slice(0, 4000)
      };
    });

    console.log('Execution 118 Data:', execData.url, execData.title);
    console.log('Snippet:\n', execData.bodyText.slice(0, 3000));

  } finally {
    browser.disconnect();
  }
}

checkExecution118().catch(console.error);
