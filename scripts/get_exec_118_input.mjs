import puppeteer from 'puppeteer-core';

async function getExecution118NodeInput() {
  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
  try {
    const pages = await browser.pages();
    let n8nPage = pages.find(p => p.url().includes('n8n.cloud'));

    const nodeData = await n8nPage.evaluate(() => {
      const el = document.querySelector('#app');
      let vueApp = el?.__vue_app__;
      let pinia = vueApp?.config?.globalProperties?.$pinia;
      const execStore = pinia._s.get('executionData/118');

      const getter = execStore?.getExecutionRunDataByNodeName;
      const propSubmitted = getter ? getter('Property Submitted') : null;
      const normalize = getter ? getter('Normalize Payload') : null;
      const escalate = getter ? getter('Escalate to Human Review') : null;

      return {
        propSubmitted,
        normalize,
        escalate
      };
    });

    console.log('Node Data:\n', JSON.stringify(nodeData, null, 2));

  } finally {
    browser.disconnect();
  }
}

getExecution118NodeInput().catch(console.error);
