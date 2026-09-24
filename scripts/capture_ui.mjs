import { chromium } from 'playwright';

async function capture() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log('Navigating to Dossiers...');
  await page.goto('http://localhost:5173/#/dossiers-enquete', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'ui_dossier.png' });

  console.log('Navigating to Mon Travail...');
  await page.goto('http://localhost:5173/#/mon-travail', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'ui_montravail.png' });

  console.log('Navigating to Paramètres...');
  await page.goto('http://localhost:5173/#/parametres', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'ui_parametres.png' });

  await browser.close();
  console.log('Screenshots captured successfully.');
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
