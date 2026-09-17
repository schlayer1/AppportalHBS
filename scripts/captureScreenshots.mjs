import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:4173';
const OUTPUT_DIR = path.resolve('docs/screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function capture() {
  console.log('🚀 Starte Screenshot-Erstellung mit Headless Chrome...');
  
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--hide-scrollbars', '--disable-web-security']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  // 1. Screenshot: Login Gate
  console.log('📸 1. Erfasse Login-Gate...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_login_gate.png') });

  // 2. Screenshot: Portal Overview (Bento Grid)
  console.log('📸 2. Erfasse Portal-Übersicht (Bento-Grid)...');
  await page.evaluate(() => {
    localStorage.setItem('hbs_current_portal_user_v1', JSON.stringify({
      id: 'teacher-demo',
      name: 'Kollegium (Demo)',
      role: 'teacher'
    }));
    localStorage.setItem('hbs_portal_view_mode', 'bento');
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02_portal_overview.png') });

  // 3. Screenshot: Digitale Tafel
  console.log('📸 3. Erfasse Digitale Tafel...');
  await page.evaluate(() => {
    localStorage.setItem('hbs_guest_portal_mode_v1', 'true');
    const screens = [{
      id: 'screen-demo',
      title: 'Tafel 1 • Unterricht',
      backgroundId: 'chalkboard',
      widgets: [
        {
          id: 'w-clock',
          type: 'clock',
          title: 'Unterrichtsuhr',
          x: 40,
          y: 40,
          width: 320,
          height: 220,
          zIndex: 10
        },
        {
          id: 'w-timer',
          type: 'visual-timer',
          title: 'Arbeitszeit (Kuchen-Timer)',
          x: 390,
          y: 40,
          width: 320,
          height: 360,
          zIndex: 11
        },
        {
          id: 'w-draw',
          type: 'draw',
          title: 'Zeichnen (Handballenschutz aktiv)',
          x: 740,
          y: 40,
          width: 420,
          height: 360,
          zIndex: 12,
          data: { paths: [] }
        },
        {
          id: 'w-traffic',
          type: 'traffic-light',
          title: 'Ampelphase',
          x: 40,
          y: 290,
          width: 200,
          height: 340,
          zIndex: 13
        },
        {
          id: 'w-sound',
          type: 'sound-level',
          title: 'Lärmampel',
          x: 270,
          y: 420,
          width: 340,
          height: 280,
          zIndex: 14
        }
      ]
    }];
    localStorage.setItem('hbs_board_deck_v1', JSON.stringify(screens));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03_digitale_tafel.png') });

  // 4. Screenshot: HBS Menti Dashboard
  console.log('📸 4. Erfasse HBS Menti...');
  await page.evaluate(() => {
    localStorage.removeItem('hbs_guest_portal_mode_v1');
    localStorage.setItem('hbs_current_portal_user_v1', JSON.stringify({
      id: 'teacher-demo',
      name: 'Kollegium (Demo)',
      role: 'teacher'
    }));
  });
  await page.goto(`${BASE_URL}/#menti`, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04_menti_dashboard.png') });

  // 5. Screenshot: HBS Kahoot Dashboard
  console.log('📸 5. Erfasse HBS Kahoot!...');
  await page.goto(`${BASE_URL}/#kahoot`, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '05_kahoot_dashboard.png') });

  // 6. Screenshot: HBS Oncoo Dashboard
  console.log('📸 6. Erfasse HBS Oncoo...');
  await page.goto(`${BASE_URL}/#oncoo`, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '06_oncoo_dashboard.png') });

  // 7. Screenshot: QR-Code Tischaufsteller Generator
  console.log('📸 7. Erfasse QR-Code Tischaufsteller Generator...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const tentBtn = buttons.find(b => b.textContent && b.textContent.includes('Aufsteller'));
    if (tentBtn) tentBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '07_tischaufsteller_generator.png') });

  await browser.close();
  console.log('🎉 Alle 7 Screenshots erfolgreich erfasst!');
}

capture().catch(err => {
  console.error('Fehler bei Screenshot-Erstellung:', err);
  process.exit(1);
});
