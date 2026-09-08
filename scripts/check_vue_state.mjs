import puppeteer from 'puppeteer-core';

async function checkVueState() {
  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
  try {
    const pages = await browser.pages();
    let n8nPage = pages.find(p => p.url().includes('n8n.cloud'));

    const debugInfo = await n8nPage.evaluate(() => {
      // Find Pinia or Vue store
      const el = document.querySelector('#app');
      let vueApp = el?.__vue_app__;
      let pinia = vueApp?.config?.globalProperties?.$pinia;
      let state = pinia?.state?.value;

      return {
        hasPinia: Boolean(pinia),
        storeKeys: state ? Object.keys(state) : [],
        executionsStore: state?.executions ? {
          activeExecution: state.executions.activeExecution,
          selectedExecution: state.executions.selectedExecution
        } : null,
        workflowsStore: state?.workflows ? {
          workflow: state.workflows.workflow?.name
        } : null
      };
    });

    console.log('Pinia Debug:', JSON.stringify(debugInfo, null, 2));

  } finally {
    browser.disconnect();
  }
}

checkVueState().catch(console.error);
