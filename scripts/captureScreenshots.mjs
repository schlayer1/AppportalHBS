import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:4173';
const DOCS_DIR = path.resolve('docs/screenshots');
const PUBLIC_DIR = path.resolve('public/screenshots');

[DOCS_DIR, PUBLIC_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

async function saveScreenshot(page, filename) {
  const docsPath = path.join(DOCS_DIR, filename);
  const publicPath = path.join(PUBLIC_DIR, filename);
  await page.screenshot({ path: docsPath });
  fs.copyFileSync(docsPath, publicPath);
  console.log(`   ✓ Gespeichert: docs/screenshots/${filename} & public/screenshots/${filename}`);
}

async function capture() {
  console.log('🚀 Starte professionelle Screenshot-Erfassung mit Headless Chrome...');
  
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
  await saveScreenshot(page, '01_login_gate.png');

  // Helper function to set teacher credentials cleanly
  const setupTeacherStorage = async (extraStorage = {}) => {
    await page.evaluate((extras) => {
      localStorage.clear();
      localStorage.setItem('hbs_current_portal_user_v1', JSON.stringify({
        id: 'teacher-demo',
        name: 'Kollegium (Demo)',
        role: 'teacher'
      }));
      localStorage.setItem('hbs_onboarding_completed', 'true');
      localStorage.setItem('hbs_portal_view_mode', 'bento');
      for (const [k, v] of Object.entries(extras)) {
        localStorage.setItem(k, v);
      }
    }, extraStorage);
  };

  // 2. Screenshot: Portal Overview (Bento Grid)
  console.log('📸 2. Erfasse Portal-Übersicht (Bento-Grid)...');
  await setupTeacherStorage();
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));
  await saveScreenshot(page, '02_portal_overview.png');

  // 3. Screenshot: Digitale Tafel
  console.log('📸 3. Erfasse Digitale Tafel...');
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
  await setupTeacherStorage({
    'hbs_board_deck_v1': JSON.stringify(screens)
  });
  await page.goto(`${BASE_URL}/#tafel`, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));
  await saveScreenshot(page, '03_digitale_tafel.png');

  // 4. Screenshot: HBS Menti Dashboard
  console.log('📸 4. Erfasse HBS Menti Dashboard...');
  await setupTeacherStorage();
  await page.goto(`${BASE_URL}/#menti`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.body.innerText.includes('HBS Menti') || document.body.innerText.includes('Abfragen'));
  await new Promise(r => setTimeout(r, 1500));
  await saveScreenshot(page, '04_menti_dashboard.png');

  // 5. Screenshot: HBS Kahoot Dashboard
  console.log('📸 5. Erfasse HBS Kahoot Dashboard...');
  await setupTeacherStorage();
  await page.goto(`${BASE_URL}/#kahoot`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.body.innerText.includes('HBS Kahoot') || document.body.innerText.includes('Quiz'));
  await new Promise(r => setTimeout(r, 1500));
  await saveScreenshot(page, '05_kahoot_dashboard.png');

  // 6. Screenshot: HBS Oncoo Dashboard
  console.log('📸 6. Erfasse HBS Oncoo Dashboard...');
  await setupTeacherStorage();
  await page.goto(`${BASE_URL}/#oncoo`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.body.innerText.includes('HBS Oncoo') || document.body.innerText.includes('Kartenabfrage'));
  await new Promise(r => setTimeout(r, 1500));
  await saveScreenshot(page, '06_oncoo_dashboard.png');

  // 7. Screenshot: QR-Code Tischaufsteller Generator
  console.log('📸 7. Erfasse QR-Code Tischaufsteller Generator...');
  await setupTeacherStorage();
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1200));
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const tentBtn = buttons.find(b => b.textContent && b.textContent.includes('Aufsteller'));
    if (tentBtn) tentBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await saveScreenshot(page, '07_tischaufsteller_generator.png');

  await browser.close();
  console.log('🎉 Alle 7 Screenshots erfolgreich und fehlerfrei erfasst & synchronisiert!');
}

capture().catch(err => {
  console.error('Fehler bei Screenshot-Erstellung:', err);
  process.exit(1);
});
