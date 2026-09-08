import puppeteer from 'puppeteer-core';

async function testGisCards() {
  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
  const page = await browser.newPage();

  try {
    console.log('Navigating to http://localhost:3000/properties...');
    await page.goto('http://localhost:3000/properties', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    // Inspect cards on /properties
    const cardData = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('a[href^="/properties/"]'));
      return cards.map(c => {
        const title = c.querySelector('p.font-medium')?.textContent?.trim();
        const passport = c.querySelector('p.font-mono')?.textContent?.trim();
        const coordsBadge = c.querySelector('.font-mono.text-muted-foreground')?.textContent?.trim();
        const verticesBadge = c.querySelector('.text-primary')?.textContent?.trim();
        const polygon = c.querySelector('polygon')?.getAttribute('points');
        const href = c.getAttribute('href');
        return { title, passport, href, coordsBadge, verticesBadge, polygonPoints: polygon?.slice(0, 50) };
      });
    });

    console.log('Properties Cards on /properties:\n', JSON.stringify(cardData, null, 2));

    // Inspect Property 1: p_001
    console.log('\nNavigating to /properties/p_001...');
    await page.goto('http://localhost:3000/properties/p_001', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2500));

    const p1Detail = await page.evaluate(() => {
      const title = document.querySelector('h1')?.textContent?.trim();
      const hasMapCanvas = document.querySelectorAll('.maplibregl-canvas').length;
      const coordsText = document.body.innerText.match(/12\.9716/);
      return { title, hasMapCanvas, hasCoords: Boolean(coordsText) };
    });
    console.log('Property 1 Detail:', p1Detail);

    // Inspect Property 2: p_002
    console.log('\nNavigating to /properties/p_002...');
    await page.goto('http://localhost:3000/properties/p_002', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2500));

    const p2Detail = await page.evaluate(() => {
      const title = document.querySelector('h1')?.textContent?.trim();
      const hasMapCanvas = document.querySelectorAll('.maplibregl-canvas').length;
      const coordsText = document.body.innerText.match(/12\.2958/);
      return { title, hasMapCanvas, hasCoords: Boolean(coordsText) };
    });
    console.log('Property 2 Detail:', p2Detail);

  } finally {
    await page.close();
    browser.disconnect();
  }
}

testGisCards().catch(console.error);
