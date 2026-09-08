import puppeteer from 'puppeteer-core';

async function getExecution118InputData() {
  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
  try {
    const pages = await browser.pages();
    let n8nPage = pages.find(p => p.url().includes('n8n.cloud'));

    const res = await n8nPage.evaluate(() => {
      const el = document.querySelector('#app');
      let vueApp = el?.__vue_app__;
      let pinia = vueApp?.config?.globalProperties?.$pinia;
      const execStore = pinia._s.get('executionData/118');

      // Check run data
      const snapshot = execStore?.getExecutionSnapshot ? execStore.getExecutionSnapshot() : null;
      const runData = execStore?.executionRunData;

      return {
        runDataKeys: runData ? Object.keys(runData) : [],
        runDataSummary: runData,
        snapshot
      };
    });

    console.log('RunData Keys:', res.runDataKeys);
    console.log('Snapshot / RunData:\n', JSON.stringify(res, null, 2).slice(0, 3000));

  } finally {
    browser.disconnect();
  }
}

getExecution118InputData().catch(console.error);
