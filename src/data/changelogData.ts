import { ChangelogRelease } from '../types/requestTypes';

export const CHANGELOG_RELEASES: ChangelogRelease[] = [
  {
    version: '2.3.0',
    title: 'Kollegiums-Wünsche, neues App-Symbol & Tafel-Verbesserungen',
    date: '19. September 2026',
    isLatest: true,
    highlight: 'Neuer Wünsche-Kasten fürs Kollegium, eigenes Changelog-Menü, Schulsiegel als Handy-App-Symbol, wischbare Tafel auf dem iPhone und freie Video-Wiedergabe.',
    items: [
      {
        id: 'cl-23-1',
        type: 'neu',
        title: 'Wünsche & Feedback (Digitaler Wunschkasten fürs Kollegium)',
        description: 'Neuer eigener Menüpunkt „Wünsche“ oben in der Leiste: Sie können ab sofort eigene Vorschläge für neue Apps, didaktische Ideen für den Unterricht oder Fehlerberichte einreichen. Kolleginnen und Kollegen können mit dem Daumen-hoch-Knopf (Upvote) dafür abstimmen, damit die meistgewünschten Funktionen zuerst umgesetzt werden.',
        badge: 'Kollegium'
      },
      {
        id: 'cl-23-2',
        type: 'neu',
        title: 'Was ist neu? (Interaktives Änderungsbuch / Changelog)',
        description: 'Neuer eigener Menüpunkt „Changelog“ oben in der Leiste: Ein übersichtliches Notizbuch aller Portal-Aktualisierungen. Hier sehen Sie jederzeit in leicht verständlicher Sprache, welche Verbesserungen und Hilfen für den Schulalltag neu dazugekommen sind.',
        badge: 'Transparenz'
      },
      {
        id: 'cl-23-3',
        type: 'verbessert',
        title: 'Freie Videos abspielen (eigene Videodateien, MP4 & Streaming)',
        description: 'Im Video-Fenster der digitalen Tafel können Sie jetzt auch eigene Videodateien (.mp4, .mov, .webm vom Speicher/USB-Stick) oder freie Internet-Videos abspielen. Hinweis: Manche geschützten Mediatheken verbieten aus Sicherheitsgründen das direkte Einbetten (sog. iFrame-Sperre). Das Fenster erkennt dies nun automatisch und bietet Ihnen einen praktischen Knopf „In neuem Tab abspielen“ sowie einen Schüler-QR-Code zum Scannen von der Tafel.',
        badge: 'Tafel-Videos'
      },
      {
        id: 'cl-23-4',
        type: 'verbessert',
        title: 'Wischbare Menüleiste am Smartphone & iPhone',
        description: 'Auf kleinen Handy-Bildschirmen waren bisher manche Knöpfe der Tafel abgeschnitten. Jetzt sind die Leisten wischbar: Sie können die Steuerknöpfe oben und die Werkzeugleiste unten einfach mit dem Daumen horizontal nach links und rechts schieben (wischen), sodass jedes Werkzeug bequem erreichbar ist.',
        badge: 'Handy-Nutzung'
      },
      {
        id: 'cl-23-5',
        type: 'verbessert',
        title: 'Offizielles Schulsiegel als App-Symbol auf dem Startbildschirm',
        description: 'Wenn Sie das Portal auf Ihrem iPhone, iPad oder Android-Gerät „Zum Home-Bildschirm hinzufügen“ (wie eine richtige App installieren), erscheint auf Ihrem Display ab sofort das gestochen scharfe, bunte Wappen der Heimbürgeschule – statt eines leeren Standard-Symbols.',
        badge: 'App-Symbol'
      },
      {
        id: 'cl-23-6',
        type: 'behoben',
        title: 'Gastmodus am Smartboard aufgeräumt',
        description: 'Wenn Sie die Tafel ohne vorherige Anmeldung am Klassen-Smartboard starten (als Tafel-Gast), sind persönliche Knöpfe wie „Speichern“ oder „Vorlagen laden“ und die Begrüßungstour ausgeblendet. So bleibt der Bildschirm übersichtlich und sofort einsatzbereit für den Unterricht.',
        badge: 'Gast-Tafel'
      },
      {
        id: 'cl-23-7',
        type: 'verbessert',
        title: 'Automatische Synchronisation zwischen all Ihren Geräten (Cloud-Sync)',
        description: 'Echtzeit-Synchronisation (Cloud-Sync = automatischer Datenabgleich übers Schulkonto): Wenn Sie an Ihrem iMac oder Dienst-Laptop Favoriten-Sterne vergeben, eigene Weblinks anlegen oder Apps sortieren, sind diese Änderungen im selben Moment auch auf Ihrem Smartphone oder Tablet sichtbar – ganz ohne die Seite neu laden zu müssen.',
        badge: 'Cloud-Sync'
      },
      {
        id: 'cl-23-8',
        type: 'verbessert',
        title: 'Startseite aufgeräumt (KI-Studio Einstellungskachel)',
        description: 'Die Kachel „Google Gemini KI-Studio“ wurde aus der Kachel-Übersicht entfernt, da sie nur für technische Einstellungen gedacht war. Alle nützlichen KI-Werkzeuge für automatische Quizfragen und Tafel-Ideen bleiben natürlich wie gewohnt über den Menüpunkt „KI-Studio“ sowie direkt in Kahoot und Menti für Sie da.',
        badge: 'Startseite'
      }
    ]
  },
  {
    version: '2.2.0',
    title: 'Künstliche Intelligenz (Google Gemini) für Quizze & Menti-Folien',
    date: '17. September 2026',
    items: [
      {
        id: 'cl-22-1',
        type: 'neu',
        title: '1-Klick-Fragengenerator mit Google Gemini KI',
        description: 'Lehrkräfte können jetzt direkt in HBS Kahoot und HBS Menti per Knopfdruck vollständige Multiple-Choice-Fragen, Vokabeltests und Umfragefolien zu jedem Schulthema von der KI entwerfen lassen.',
        badge: 'KI-Helfer'
      },
      {
        id: 'cl-22-2',
        type: 'verbessert',
        title: 'Zukunftssichere Verbindung (Modell-Kaskade)',
        description: 'Modell-Kaskade bedeutet: Das System prüft im Hintergrund automatisch, welche KI-Versionen von Google gerade am schnellsten und aktuellsten sind. Ältere, vom Hersteller abgeschaltete Versionen werden unbemerkt übersprungen, damit die KI für Sie dauerhaft zuverlässig funktioniert.',
        badge: 'Zuverlässigkeit'
      }
    ]
  },
  {
    version: '2.1.0',
    title: 'Einführungstour & Bebildertes Handbuch',
    date: '16. September 2026',
    items: [
      {
        id: 'cl-21-1',
        type: 'neu',
        title: 'Interaktive Kennenlern-Tour (Onboarding)',
        description: 'Ein freundlicher 6-Schritte-Assistent führt Kolleginnen und Kollegen beim ersten Besuch durch alle wichtigen Bereiche des Portals und zeigt, wo Sie Apps, die Tafel und Ihre Favoriten finden.',
        badge: 'Einstieg'
      },
      {
        id: 'cl-21-2',
        type: 'neu',
        title: 'Druckfertiges Kollegiums-Handbuch (PDF)',
        description: 'Vollständiges, bebildertes Benutzerhandbuch mit praktischen Unterrichtsbeispielen – direkt im Portal lesbar oder als PDF zum Ausdrucken.',
        badge: 'Handbuch'
      }
    ]
  },
  {
    version: '2.0.0',
    title: 'Start des neuen digitalen App-Portals',
    date: 'Schuljahr 2026/2027',
    items: [
      {
        id: 'cl-20-1',
        type: 'neu',
        title: 'Gemeinsamer Hub für die Heimbürgeschule',
        description: 'Zentrale Anlaufstelle für Kollegium, Smartboard und Schüler: Bento-Raster (übersichtliche Kachelansicht mit großen Symbolen), Kompakt-Modus für Smartphones sowie 26 integrierte Tafel-Werkzeuge, HBS Menti, Kahoot und Oncoo ohne Werbetracker.',
        badge: 'Schulportal'
      }
    ]
  }
];
