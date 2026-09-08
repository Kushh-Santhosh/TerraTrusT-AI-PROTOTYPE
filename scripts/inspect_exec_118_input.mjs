import puppeteer from 'puppeteer-core';

async function checkExecution118Input() {
  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
  try {
    const pages = await browser.pages();
    let n8nPage = pages.find(p => p.url().includes('n8n.cloud'));

    // Click on Property Submitted node or Input tab
    const inputData = await n8nPage.evaluate(async () => {
      // Look for button or tab with text "Input"
      const buttons = Array.from(document.querySelectorAll('button, div, span')).filter(el => el.innerText?.trim() === 'Input');
      if (buttons.length > 0) {
        buttons[0].click();
      }
      await new Promise(r => setTimeout(r, 1000));
      return document.body.innerText.slice(0, 4000);
    });

    console.log('Snippet after clicking Input:\n', inputData.slice(0, 2000));

  } finally {
    browser.disconnect();
  }
}

checkExecution118Input().catch(console.error);
