import puppeteer from 'puppeteer-core';

async function checkPiniaStores() {
  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
  try {
    const pages = await browser.pages();
    let n8nPage = pages.find(p => p.url().includes('n8n.cloud'));

    const res = await n8nPage.evaluate(() => {
      const el = document.querySelector('#app');
      let vueApp = el?.__vue_app__;
      let pinia = vueApp?.config?.globalProperties?.$pinia;
      if (!pinia) return { error: 'No pinia' };

      const execStore = pinia._s.get('executionData/118');
      const docStore = pinia._s.get('workflowDocuments/2tzD8K0zTU43KzGH@execution-preview') || pinia._s.get('workflowDocuments/2tzD8K0zTU43KzGH@latest');
      const executionsStore = pinia._s.get('executions');

      return {
        execStoreKeys: execStore ? Object.keys(execStore) : [],
        execution: execStore?.execution ? {
          id: execStore.execution.id,
          status: execStore.execution.status,
          startedAt: execStore.execution.startedAt,
          stoppedAt: execStore.execution.stoppedAt,
          workflowId: execStore.execution.workflowId,
          data: execStore.execution.data
        } : null,
        workflowName: docStore?.name || docStore?.workflow?.name || executionsStore?.workflow?.name
      };
    });

    console.log('Result:', JSON.stringify(res, null, 2).slice(0, 3000));

  } finally {
    browser.disconnect();
  }
}

checkPiniaStores().catch(console.error);
