import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SCREENSHOTS_DIR = path.resolve('docs/screenshots');

function getBase64Image(filename) {
  const filePath = path.join(SCREENSHOTS_DIR, filename);
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath);
    return `data:image/png;base64,${data.toString('base64')}`;
  }
  return '';
}

function getLogoBase64() {
  const logoPath = path.resolve('public/Siegel_bunt.png');
  if (fs.existsSync(logoPath)) {
    const data = fs.readFileSync(logoPath);
    return `data:image/png;base64,${data.toString('base64')}`;
  }
  return '';
}

const logoBase64 = getLogoBase64();
const imgLogin = getBase64Image('01_login_gate.png');
const imgPortal = getBase64Image('02_portal_overview.png');
const imgTafel = getBase64Image('03_digitale_tafel.png');
const imgMenti = getBase64Image('04_menti_dashboard.png');
const imgKahoot = getBase64Image('05_kahoot_dashboard.png');
const imgOncoo = getBase64Image('06_oncoo_dashboard.png');
const imgTent = getBase64Image('07_tischaufsteller_generator.png');

const htmlContent = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Handbuch HBS App-Portal • Heimbürgeschule Kahla</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 18mm 16mm 18mm 16mm;
      @bottom-right {
        content: "Seite " counter(page);
        font-size: 8pt;
        color: #64748b;
        font-family: system-ui, sans-serif;
      }
      @bottom-left {
        content: "HBS App-Portal • Handbuch für das Kollegium";
        font-size: 8pt;
        color: #64748b;
        font-family: system-ui, sans-serif;
      }
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.5;
      font-size: 10pt;
      margin: 0;
      padding: 0;
    }
    .page-break { page-break-before: always; }
    .no-break { page-break-inside: avoid; }

    /* Cover Page */
    .cover-page {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      text-align: center;
      padding: 30px 10px;
    }
    .cover-crest {
      width: 140px;
      height: 140px;
      margin: 0 auto 20px auto;
      display: block;
    }
    .cover-school {
      font-size: 14pt;
      font-weight: 800;
      color: #0B7BA7;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 8px;
    }
    .cover-title {
      font-size: 26pt;
      font-weight: 900;
      color: #091D2E;
      line-height: 1.15;
      margin: 15px 0;
    }
    .cover-subtitle {
      font-size: 12pt;
      color: #475569;
      max-width: 520px;
      margin: 0 auto 30px auto;
      font-weight: 500;
    }
    .cover-badge {
      display: inline-block;
      padding: 6px 16px;
      background: #E6F4F8;
      border: 1.5px solid #0B7BA7;
      color: #004C6A;
      font-weight: 800;
      border-radius: 30px;
      font-size: 10pt;
      margin-bottom: 20px;
    }
    .cover-meta {
      font-size: 9.5pt;
      color: #64748b;
      border-top: 1.5px solid #cbd5e1;
      padding-top: 15px;
      display: flex;
      justify-content: space-between;
    }

    /* Headings */
    h1 {
      font-size: 17pt;
      font-weight: 800;
      color: #0B7BA7;
      border-bottom: 2px solid #0B7BA7;
      padding-bottom: 5px;
      margin-top: 25px;
      margin-bottom: 12px;
    }
    h2 {
      font-size: 13pt;
      font-weight: 800;
      color: #091D2E;
      margin-top: 20px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    h3 {
      font-size: 11pt;
      font-weight: 700;
      color: #1e293b;
      margin-top: 14px;
      margin-bottom: 6px;
    }
    p { margin: 0 0 10px 0; }
    ul { margin: 0 0 12px 0; padding-left: 20px; }
    li { margin-bottom: 4px; }

    /* Screenshot Callouts */
    .screenshot-card {
      margin: 14px 0;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      overflow: hidden;
      background: #ffffff;
      box-shadow: 0 3px 10px rgba(0,0,0,0.06);
      page-break-inside: avoid;
    }
    .screenshot-img {
      width: 100%;
      height: auto;
      display: block;
    }
    .screenshot-caption {
      font-size: 8.5pt;
      color: #475569;
      background: #f8fafc;
      padding: 6px 12px;
      border-top: 1px solid #e2e8f0;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 8.5pt;
      page-break-inside: avoid;
    }
    th {
      background: #0B7BA7;
      color: white;
      text-align: left;
      padding: 7px 10px;
      font-weight: 700;
    }
    td {
      padding: 6px 10px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
    }
    tr:nth-child(even) td { background: #f8fafc; }

    /* Alert / Tip Boxes */
    .tip-box {
      background: #F0F8FA;
      border-left: 4px solid #0B7BA7;
      padding: 10px 14px;
      border-radius: 0 6px 6px 0;
      margin: 12px 0;
      font-size: 9pt;
      page-break-inside: avoid;
    }
    .tip-title {
      font-weight: 800;
      color: #004C6A;
      margin-bottom: 4px;
    }

    .key-badge {
      display: inline-block;
      padding: 1px 5px;
      background: #e2e8f0;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      font-family: monospace;
      font-size: 8pt;
      font-weight: bold;
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover-page">
    <div style="margin-top: 40px;">
      ${logoBase64 ? `<img src="${logoBase64}" class="cover-crest" alt="HBS Siegel" />` : ''}
      <div class="cover-school">Staatliche Regelschule „Geschwister Scholl“ Kahla</div>
      <h1 class="cover-title" style="border:none;">HBS App-Portal<br>Offizielles Handbuch für das Kollegium</h1>
      <div class="cover-subtitle">
        Leitfaden, Funktionsübersicht und didaktische Praxisszenarien für moderne Smartboards, Tablets und das digitale Unterrichten.
      </div>
      <div class="cover-badge">Version 2.0 • Ausgabe 2026/2027 • 100% DSGVO-konform</div>
    </div>

    <div class="cover-meta">
      <span>HBS Kahla • App-Portal Dokumentation</span>
      <span>Stand: September 2026</span>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- SECTION 1: ZUGANG & AUTHENTIFIZIERUNG -->
  <h1>1. Zugang & Authentifizierung</h1>
  <p>
    Das HBS App-Portal wurde so konzipiert, dass Sie im Schulalltag innerhalb von drei Sekunden startklar sind, ohne sich komplizierte Passwörter merken zu müssen. Die Anmeldung schützt dienstliche Daten und persönliche Voreinstellungen.
  </p>

  <div class="screenshot-card">
    <img src="${imgLogin}" class="screenshot-img" alt="Anmeldebildschirm" />
    <div class="screenshot-caption">
      <span>Abbildung 1: Anmeldeportal mit den 3 Rollen (Kollegium, Admin, Tafel-Gast)</span>
      <span>Schutz für Lehrkräfte & Smartboards</span>
    </div>
  </div>

  <h2>Drei maßgeschneiderte Zugangswege</h2>
  <ul>
    <li><strong>Kollegium (Empfohlen für Ihren Unterricht):</strong> Wählen Sie Ihren Namen aus der Lehrerliste und tippen Sie Ihre persönliche 4-stellige PIN ein. Ihre Favoriten, angelegten Menti-Umfragen, Kahoot-Quizze und eigenen Weblinks stehen Ihnen sofort bereit.</li>
    <li><strong>Tafel-Gast (Für Raum-Smartboards & Vertretungsstunden):</strong> Mit einem Klick auf <em>„Tafel-Gast“</em> öffnet sich direkt die vollwertige Digitale Tafel. Sie müssen auf öffentlichen Smartboards im Klassenraum keine persönlichen Benutzerdaten eingeben.</li>
    <li><strong>Admin-Zugang:</strong> Für Schulleitung und IT-Verantwortliche zur Verwaltung der Kollegiumsliste, zum Ausdrucken von PIN-Übersichten und zur Freigabe schulweiter Vorlagen.</li>
  </ul>

  <!-- SECTION 2: PORTAL-ÜBERSICHT & ANSICHTSMODI -->
  <div class="page-break"></div>
  <h1>2. Ansichts- und Arbeitsmodi</h1>
  <p>
    Über die obere Leiste passt sich das Portal nahtlos an Ihr jeweiliges Endgerät an – vom Smartphone über das Lehrkräfte-iPad bis zum wandfüllenden 4K-Smartboard.
  </p>

  <div class="screenshot-card">
    <img src="${imgPortal}" class="screenshot-img" alt="Portal Übersicht Bento" />
    <div class="screenshot-caption">
      <span>Abbildung 2: Moderne Bento-Grid-Ansicht mit Kategoriefilter, Suchfunktion und Direktzugriffen</span>
      <span>HBS App-Portal Hauptansicht</span>
    </div>
  </div>

  <h2>Die Arbeitsmodi im Überblick</h2>
  <ul>
    <li><strong>Bento-Raster (Standard):</strong> Großzügige Kacheln mit didaktischen Hinweisen, Kurzanleitungen und direktem QR-Code-Button für Schüler.</li>
    <li><strong>Kompakt-Ansicht:</strong> Platzsparende Listenansicht für das Smartphone in kurzen Pausen oder für schnelle Recherchen.</li>
    <li><strong>Smartboard-Beamer-Modus:</strong> Maximale Klickflächen und Kontraste für zuverlässige Touch-Bedienung an der interaktiven Tafel.</li>
    <li><strong>Kategorienschnellfilter:</strong> Schalten Sie mit einem Klick zwischen <em>„Unterricht & Schüler“</em>, <em>„Lehrerzimmer & Kollegium“</em> oder <em>„Meine Links“</em> um.</li>
  </ul>

  <!-- SECTION 3: DIGITALE TAFEL -->
  <div class="page-break"></div>
  <h1>3. Digitale Tafel (Classroom-Screen-Erweiterung)</h1>
  <p>
    Die Digitale Tafel ist das Herzstück für Ihren Unterricht am Smartboard. Sie bietet 26 spezialisierte Unterrichts-Widgets, die Sie frei anordnen, skalieren und minimieren können.
  </p>

  <div class="screenshot-card">
    <img src="${imgTafel}" class="screenshot-img" alt="Digitale Tafel mit Widgets" />
    <div class="screenshot-caption">
      <span>Abbildung 3: Digitale Tafel mit Uhr, Kuchen-Timer, Freihandzeichnung (Handballenschutz) & Ampeln</span>
      <span>Liquid-Glass Dock & 26 Widgets</span>
    </div>
  </div>

  <h2>Herausragende Funktionen der Digitalen Tafel</h2>
  <ul>
    <li><strong>Handballenschutz (Palm Rejection) im Zeichen-Widget:</strong> Aktivieren Sie den Stift-Modus (<span class="key-badge">Nur Stift</span>). Das System ignoriert aufliegende Handballen beim Zeichnen mit dem Apple Pencil oder Touchpen vollständig.</li>
    <li><strong>Tafel-Vorhang & Spotlight:</strong> Ziehen Sie eine realistische Holz-Rollo-Abdeckung schrittweise herunter, um Aufgaben oder Lösungen erst bei Bedarf zu enthüllen. Im Spotlight-Modus wird die Aufmerksamkeit auf ein einzelnes Wort fokussiert.</li>
    <li><strong>Globale Undo/Redo-Funktion:</strong> Haben Sie versehentlich ein Widget verschoben oder gelöscht? Drücken Sie <span class="key-badge">Strg + Z</span> (Mac: <span class="key-badge">Cmd + Z</span>), um jede Aktion rückgängig zu machen.</li>
    <li><strong>Tafelbild-Export als Schüler-PDF & Bild:</strong> Speichern Sie Ihr Tafelbild als scharfes PNG/JPEG oder drucken Sie ein strukturiertes DIN-A4 Stundenprotokoll für abwesende Schüler.</li>
  </ul>

  <!-- SECTION 4: HBS MENTI -->
  <div class="page-break"></div>
  <h1>4. HBS Menti (Interaktive Live-Abfragen)</h1>
  <p>
    Mit HBS Menti binden Sie alle Schülerinnen und Schüler aktiv in den Unterricht ein. Schüler scannen den projizierten QR-Code mit ihrem Smartphone oder Schul-iPad und stimmen anonym und in Echtzeit ab – ohne Registrierung.
  </p>

  <div class="screenshot-card">
    <img src="${imgMenti}" class="screenshot-img" alt="HBS Menti Dashboard" />
    <div class="screenshot-caption">
      <span>Abbildung 4: HBS Menti Dashboard mit Ordnerstruktur, Vorlagen und Live-Präsentationsstart</span>
      <span>Interaktive Schüler-Beteiligung</span>
    </div>
  </div>

  <h2>Verfügbare Folientypen & Interaktionsformen</h2>
  <ul>
    <li><strong>Dynamische Wortwolke:</strong> Häufig genannte Begriffe wachsen live an der Tafel – ideal zur Aktivierung von Vorwissen.</li>
    <li><strong>2×2 Priorisierungsmatrix:</strong> Schüler setzen Punkte in ein 4-Quadranten-Feld (z. B. <em>Wichtigkeit vs. Dringlichkeit</em>). Das System berechnet live den Schwerpunkt der Klasse.</li>
    <li><strong>Rangfolge (Ranking):</strong> Schüler ordnen Thesen oder historische Ereignisse. Per <em>Borda-Count</em>-Verfahren wird das Klassenergebnis mit Treppchen animiert.</li>
    <li><strong>Skalen & Multiple-Choice:</strong> Verstehenskontrollen mit prozentualer Verteilung und Durchschnittswerten.</li>
    <li><strong>1-Klick-Übernahme auf die Tafel:</strong> Übertragen Sie das fertige Menti-Ergebnis mit einem Klick als Widget auf Ihre Digitale Tafel.</li>
  </ul>

  <!-- SECTION 5: HBS KAHOOT! -->
  <div class="page-break"></div>
  <h1>5. HBS Kahoot! (Gamification & KI-Generator)</h1>
  <p>
    HBS Kahoot bringt echte Quizshow-Spannung in den Klassenraum – komplett schulintern, werbefrei und mit KI-Unterstützung.
  </p>

  <div class="screenshot-card">
    <img src="${imgKahoot}" class="screenshot-img" alt="HBS Kahoot Dashboard" />
    <div class="screenshot-caption">
      <span>Abbildung 5: HBS Kahoot Studio mit KI-Fragen-Generator, Kollegiums-Vorlagen & Druckbogen</span>
      <span>Spannende Klassen-Wettbewerbe</span>
    </div>
  </div>

  <h2>Besondere Funktionen für Lehrkräfte</h2>
  <ul>
    <li><strong>✨ KI-Quiz-Generator:</strong> Geben Sie ein beliebiges Unterrichtsthema ein. Die integrierte KI formuliert sekundenschnell 5 bis 10 Multiple-Choice-Fragen mit plausiblen Antwortmöglichkeiten.</li>
    <li><strong>Team-Modus mit 5-Sekunden-Beratung:</strong> Schüler treten in Tischgruppen an. Zu Beginn jeder Frage läuft eine kurze Beratungsphase, in der die Knöpfe gesperrt sind – für echte Teamarbeit statt Hektik.</li>
    <li><strong>A4-Notfall-Arbeitsblatt & Lösungsbogen:</strong> Drucken Sie jedes Quiz mit einem Klick als fertiges Kopierblatt mit Schulsiegel und Ankreuzkästchen sowie Lösungsbogen für Vertretungsstunden aus.</li>
    <li><strong>Prozedurale Hintergrundmusik:</strong> Ein interner Synthesizer erzeugt echten Spielshow-Sound und spannende Countdown-Ticks ohne externe MP3-Ladezeiten.</li>
  </ul>

  <!-- SECTION 6: HBS ONCOO -->
  <div class="page-break"></div>
  <h1>6. HBS Oncoo (Kooperative Lernformen nach Klippert)</h1>
  <p>
    HBS Oncoo digitalisiert die 5 beliebtesten Methoden für schülerzentriertes, kooperatives Arbeiten im Klassenraum.
  </p>

  <div class="screenshot-card">
    <img src="${imgOncoo}" class="screenshot-img" alt="HBS Oncoo Dashboard" />
    <div class="screenshot-caption">
      <span>Abbildung 6: HBS Oncoo Werkzeuge (Kartenabfrage, Zielscheibe, Lerntempoduett, Helfersystem, Placemat)</span>
      <span>Kooperatives Lernen digital</span>
    </div>
  </div>

  <h2>Die 5 Oncoo-Methoden im Detail</h2>
  <ul>
    <li><strong>Kartenabfrage (Digitale Pinnwand):</strong> Schüler senden bunte Kärtchen an die Tafel. Sie können Spalten bilden, Karten clustern, Eingaben sperren und das Ergebnis als <strong>Querformat-Druckbogen (DIN A4)</strong> drucken oder auf die Tafel exportieren.</li>
    <li><strong>Zielscheibe:</strong> Bis zu 4 Kriterien visuell evaluieren. Schüler setzen ihre Punkte per Fingertipp auf eine Zielscheibe.</li>
    <li><strong>Lerntempoduett:</strong> Sobald ein Schüler eine Einzelaufgabe beendet hat, meldet er sich per Klick fertig. Das System matcht automatisch die jeweils nächsten beiden fertigen Schüler zu einem Partnertandem.</li>
    <li><strong>Helfersystem:</strong> Transparente Klassenbörse: Wer braucht bei welcher Aufgabe Unterstützung und wer kann helfen?</li>
    <li><strong>Placemat:</strong> Vier Schüler arbeiten an den Ecken eines Tisches; das gemeinsame Synthesefeld liegt in der Mitte.</li>
  </ul>

  <!-- SECTION 7: TISCHAUFSTELLER-GENERATOR -->
  <div class="page-break"></div>
  <h1>7. QR-Code Tischaufsteller-Generator (DIN A4 Faltprisma)</h1>
  <p>
    Nie wieder langwieriges Eintippen von Internetadressen im Unterricht: Mit dem integrierten Tischaufsteller-Generator erstellen Sie mit zwei Klicks druckfertige Dreiecks-Prismen für Ihre Schülertische.
  </p>

  <div class="screenshot-card">
    <img src="${imgTent}" class="screenshot-img" alt="Tischaufsteller Generator" />
    <div class="screenshot-caption">
      <span>Abbildung 7: Generator für beidseitig lesbare DIN-A4 Dreiecks-Tischaufsteller mit HBS-Siegel</span>
      <span>Sofort-Zugang für Schülertische</span>
    </div>
  </div>

  <h2>Vorteile des Faltprismas im Unterricht</h2>
  <ul>
    <li><strong>Beidseitig lesbar:</strong> Die Rückseite ist um 180° rotiert. Schüler auf beiden Tischseiten können den QR-Code aufrecht scannen.</li>
    <li><strong>Falt- und Klebelasche:</strong> Auf 160g-Karton ausgedruckt, lässt sich das Blatt in 30 Sekunden zu einem robusten Aufsteller falten.</li>
    <li><strong>Universelle Ziele:</strong> Funktioniert für das gesamte Portal, laufende Menti-Votings, Kahoot-Quizze, Oncoo-Sitzungen oder eigene Fach-Webseiten.</li>
  </ul>

  <!-- SECTION 8: DIDAKTISCHE SZENARIEN -->
  <div class="page-break"></div>
  <h1>8. Didaktische Einsatzszenarien im Unterricht</h1>

  <table>
    <thead>
      <tr>
        <th style="width: 25%;">Unterrichtsphase</th>
        <th style="width: 35%;">Empfohlene Portal-Werkzeuge</th>
        <th style="width: 40%;">Didaktischer Mehrwert</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Stundenbeginn & Begrüßung</strong></td>
        <td><em>Digitale Tafel (Preset „Begrüßung“)</em> + <em>HBS Menti (Wortwolke)</em></td>
        <td>Klare Orientierung durch visualisierte Stundenziele und Stundenplan; sofortige Aktivierung aller Schüler durch anonyme Vorwissensabfrage per Smartphone/iPad.</td>
      </tr>
      <tr>
        <td><strong>Erarbeitung (Einzelarbeit)</strong></td>
        <td><em>Digitale Tafel (Visueller Kuchen-Timer)</em> + <em>Lärmampel</em></td>
        <td>Schafft Ruhe und Zeitbewusstsein; der Kuchen-Timer zeigt Schülern visuell, wie viel Arbeitszeit verbleibt; die Lärmampel sensibilisiert für die Raumakustik.</td>
      </tr>
      <tr>
        <td><strong>Differenzierung & Kooperation</strong></td>
        <td><em>HBS Oncoo (Lerntempoduett)</em> oder <em>(Helfersystem)</em></td>
        <td>Schnelle Schüler werden sofort mit passenden Partnern gematcht, ohne Leerlauf; schwächere Schüler finden gezielt Mitschüler-Experten zur Unterstützung.</td>
      </tr>
      <tr>
        <td><strong>Gemeinsame Synthese</strong></td>
        <td><em>HBS Oncoo (Kartenabfrage)</em> → <em>Tafel-Export</em></td>
        <td>Strukturierte Sammlung von Schülerideen; geclusterte Spalten werden per Klick direkt als Text-Widget auf die Digitale Tafel für das gemeinsame Tafelbild übernommen.</td>
      </tr>
      <tr>
        <td><strong>Sicherung & Gamification</strong></td>
        <td><em>HBS Kahoot! (Team-Modus)</em></td>
        <td>Spielerische Festigung des Stoffs in Tischgruppen mit 5-Sekunden-Beratungsphase; fördert Teamgeist und Wissensabruf mit hoher Motivation.</td>
      </tr>
      <tr>
        <td><strong>Netzausfall / Vertretungsstunde</strong></td>
        <td><em>HBS Kahoot! (A4-Notfall-Arbeitsblatt)</em></td>
        <td>Keine Stunde fällt aus: Mit einem Klick druckt die Vertretungslehrkraft das Quiz als Papiertest inklusive Lösungsbogen aus.</td>
      </tr>
    </tbody>
  </table>

  <div class="tip-box">
    <div class="tip-title">💡 Tipp für Vertretungsstunden:</div>
    Nutzen Sie das Admin-Panel oder den Schnellstart-Drawer, um vorbereitete Kollegiumsvorlagen zu laden. Selbst bei Internetausfall bleiben alle Offline-Tools dank Service Worker voll einsatzbereit!
  </div>

  <!-- SECTION 9: TECHNIK UNTER DER HAUBE -->
  <div class="page-break"></div>
  <h1>9. Technik unter der Haube (Für technisch Interessierte)</h1>
  <p>
    Das HBS App-Portal wurde nach modernsten Standards für Webanwendungen als <strong>Progressive Web App (PWA)</strong> entwickelt:
  </p>

  <ul>
    <li><strong>Frontend-Framework:</strong> React 18, TypeScript 5 und Vite 6 für typsicheren, blitzschnellen Code.</li>
    <li><strong>Code-Splitting:</strong> Große Teilmodule (Tafel, Kahoot, Menti, Oncoo) werden per <code>React.lazy()</code> und <code>Suspense</code> erst bei Klick geladen. Das reduziert das Startvolumen auf ca. 705 kB.</li>
    <li><strong>Duale Synchronisation:</strong>
      <ul>
        <li><em>BroadcastChannel API:</em> Direkter Peer-Sync im Schulnetzwerk mit Latenzen unter 5 Millisekunden.</li>
        <li><em>Google Firebase Firestore:</em> Cloud-Sync in Echtzeit via <code>onSnapshot</code> für externe Smartphones im Mobilfunknetz.</li>
      </ul>
    </li>
    <li><strong>Offline-First & PWA-Cache:</strong> Ein nativer Service Worker (<code>sw.js</code>) speichert alle Kernressourcen lokal im Cache. Das Portal startet auch bei komplettem Netzausfall.</li>
    <li><strong>Prozedurale Audiosynthese:</strong> Spielshow-Sounds werden per Web Audio API direkt im Browser über Oszillatoren mathematisch berechnet (keine externen MP3-Dateien nötig).</li>
    <li><strong>100% DSGVO-konform:</strong> Null Cookies von Drittanbietern, keine Werbetracker, keine Schüler-Accounts, reine Zufalls-PINs.</li>
  </ul>

  <div style="margin-top: 40px; padding-top: 15px; border-top: 1px solid #cbd5e1; text-align: center; font-size: 8.5pt; color: #64748b;">
    <strong>Staatliche Regelschule „Geschwister Scholl“ Kahla</strong> • Heimbürgestraße • 07768 Kahla<br>
    Offizielles Kollegiums-Handbuch • Stand: Schuljahr 2026/2027
  </div>

</body>
</html>
`;

async function generatePdf() {
  console.log('📄 Schreibe docs/handbuch.html...');
  const htmlPath = path.resolve('docs/handbuch.html');
  fs.writeFileSync(htmlPath, htmlContent, 'utf-8');

  console.log('🖨️ Generiere HBS_App_Portal_Handbuch.pdf mit Headless Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1000));

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '0mm',
      bottom: '0mm',
      left: '0mm',
      right: '0mm'
    }
  });

  await browser.close();

  const pdfDest1 = path.resolve('HBS_App_Portal_Handbuch.pdf');
  const pdfDest2 = path.resolve('docs/HBS_App_Portal_Handbuch.pdf');

  fs.writeFileSync(pdfDest1, pdfBuffer);
  fs.writeFileSync(pdfDest2, pdfBuffer);

  console.log(`✅ PDF erfolgreich erstellt:`);
  console.log(`   -> ${pdfDest1} (${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`   -> ${pdfDest2}`);
}

generatePdf().catch(err => {
  console.error('Fehler bei PDF-Generierung:', err);
  process.exit(1);
});
