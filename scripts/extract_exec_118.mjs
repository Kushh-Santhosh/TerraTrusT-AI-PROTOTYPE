import puppeteer from 'puppeteer-core';

async function checkExecutionStore() {
  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
  try {
    const pages = await browser.pages();
    let n8nPage = pages.find(p => p.url().includes('n8n.cloud'));

    const data = await n8nPage.evaluate(() => {
      const el = document.querySelector('#app');
      let vueApp = el?.__vue_app__;
      let pinia = vueApp?.config?.globalProperties?.$pinia;
      let state = pinia?.state?.value;

      const exec118 = state?.['executionData/118'];
      const doc = state?.['workflowDocuments/2tzD8K0zTU43KzGH@execution-preview'] || state?.['workflowDocuments/2tzD8K0zTU43KzGH@latest'];

      return {
        workflowName: doc?.workflow?.name,
        workflowId: doc?.workflow?.id,
        execution118Keys: exec118 ? Object.keys(exec118) : [],
        execution118Data: exec118
      };
    });

    console.log('Workflow Info:', data.workflowName, 'ID:', data.workflowId);
    console.log('Execution 118 raw:\n', JSON.stringify(data.execution118Data, null, 2));

  } finally {
    browser.disconnect();
  }
}

checkExecutionStore().catch(console.error);
