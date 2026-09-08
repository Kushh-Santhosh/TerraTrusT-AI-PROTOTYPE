import puppeteer from 'puppeteer-core';

async function fetchExecutionRest() {
  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
  try {
    const pages = await browser.pages();
    let n8nPage = pages.find(p => p.url().includes('n8n.cloud'));

    const res = await n8nPage.evaluate(async () => {
      const resp = await fetch('/rest/executions/118', {
        headers: { 'Accept': 'application/json' }
      });
      return await resp.json();
    });

    console.log('Execution 118 ID:', res.id);
    console.log('Workflow Name:', res.workflowData?.name);
    console.log('Status:', res.status);
    console.log('StartedAt:', res.startedAt);
    console.log('StoppedAt:', res.stoppedAt);

    // Inspect execution data for nodes
    const runData = res.data?.resultData?.runData;
    if (runData) {
      const nodeNames = Object.keys(runData);
      console.log('Nodes executed:', nodeNames);
      for (const name of nodeNames) {
        const nodeExec = runData[name];
        console.log(`\n--- Node: ${name} ---`);
        console.log('Input:', JSON.stringify(nodeExec[0]?.data?.main?.[0]?.[0]?.json || nodeExec[0]?.inputOverride, null, 2)?.slice(0, 500));
        console.log('Output:', JSON.stringify(nodeExec[0]?.data?.main?.[0]?.map(x => x.json), null, 2)?.slice(0, 500));
      }
    }

  } finally {
    browser.disconnect();
  }
}

fetchExecutionRest().catch(console.error);
