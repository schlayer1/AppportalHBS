import { ChangelogRelease } from '../types/requestTypes';

export const CHANGELOG_RELEASES: ChangelogRelease[] = [
  {
    version: '2.3.0',
    title: 'Kollegiums-Wünsche, neues App-Symbol & Tafel-Verbesserungen',
    date: '19. September 2026',
    isLatest: true,
    highlight: 'Neuer digitaler Wunschkasten fürs Kollegium, eigenes Changelog-Menü, Schulsiegel als Handy-App-Symbol, wischbare Tafel auf dem iPhone und freie Video-Wiedergabe.',
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
        description: 'Wenn Sie das Portal auf Ihrem iPhone, iPad oder Android-Gerät „Zum Home-Bildschirm hinzufügen“ (wie eine richtige App installieren – PWA), erscheint auf Ihrem Display ab sofort das gestochen scharfe, bunte Wappen der Heimbürgeschule statt eines leeren Standard-Symbols.',
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
    version: '2.2.1',
    title: 'Offizieller Schulname & Original-Screenshots im Handbuch',
    date: '17. September 2026',
    highlight: 'Korrektur des Schulnamens im Handbuch und Austausch der Abbildungen für HBS Menti, Kahoot und Oncoo.',
    items: [
      {
        id: 'cl-221-1',
        type: 'behoben',
        title: 'Schulname überall einheitlich korrigiert',
        description: 'Im gesamten Benutzerhandbuch, in der Begrüßung und in der Einführungstour wurde die Schulbezeichnung auf „Staatliche Regelschule Heimbürgeschule Kahla“ korrigiert.',
        badge: 'Schulname'
      },
      {
        id: 'cl-221-2',
        type: 'behoben',
        title: 'Original-Screenshots für Menti, Kahoot und Oncoo',
        description: 'In der gedruckten PDF und in der Tour wurden zuvor irrtümlich Bilder der Tafel angezeigt. Diese wurden durch echte Abbildungen der Live-Abfragen (Menti), der Quiz-Arena (Kahoot) und der Lerntools (Oncoo) ersetzt.',
        badge: 'Dokumentation'
      },
      {
        id: 'cl-221-3',
        type: 'verbessert',
        title: 'Druckfertiges Kollegiums-Handbuch (8 MB PDF)',
        description: 'Das druckfertige DIN-A4-Handbuch wurde mit allen neuen Bildschirmfotos und didaktischen Praxistipps für das Lehrerzimmer neu generiert und steht zum Download bereit.',
        badge: 'PDF-Handbuch'
      }
    ]
  },
  {
    version: '2.2.0',
    title: 'Künstliche Intelligenz (Google Gemini) für Quizze & Menti-Folien',
    date: '17. September 2026',
    highlight: 'Google Gemini KI-Anbindung zur 1-Klick-Fragenerstellung in Kahoot & Menti mit automatischer Modell-Kaskade.',
    items: [
      {
        id: 'cl-22-1',
        type: 'neu',
        title: '1-Klick-Fragengenerator mit Google Gemini KI',
        description: 'Lehrkräfte können jetzt direkt in HBS Kahoot und HBS Menti per Knopfdruck vollständige Multiple-Choice-Fragen, Vokabeltests und Umfragefolien zu jedem Unterrichtsthema von der KI entwerfen lassen.',
        badge: 'KI-Helfer'
      },
      {
        id: 'cl-22-2',
        type: 'neu',
        title: 'Vorkonfigurierter Schulschlüssel aktiv',
        description: 'Der KI-Zugang für die Heimbürgeschule ist bereits fest hinterlegt. Kolleginnen und Kollegen müssen sich nirgends registrieren oder Schlüssel eingeben – alles funktioniert sofort schlüsselfertig.',
        badge: 'Einfachheit'
      },
      {
        id: 'cl-22-3',
        type: 'verbessert',
        title: 'Zukunftssichere Modell-Kaskade',
        description: 'Modell-Kaskade bedeutet: Das System prüft im Hintergrund automatisch, welche KI-Versionen von Google gerade am schnellsten und aktuellsten sind (z. B. Gemini 3.6 Flash). Ältere, vom Hersteller abgeschaltete Versionen werden unbemerkt übersprungen, damit die KI dauerhaft zuverlässig funktioniert.',
        badge: 'Zuverlässigkeit'
      }
    ]
  },
  {
    version: '2.1.0',
    title: 'Interaktive Kennenlern-Tour & QR-Tischaufsteller',
    date: '17. September 2026',
    highlight: '6-Schritte Onboarding-Tour für Kolleginnen und Kollegen, DIN-A4 Tischaufsteller-Generator und QuickTools.',
    items: [
      {
        id: 'cl-21-1',
        type: 'neu',
        title: 'Interaktive Kennenlern-Tour (Onboarding)',
        description: 'Ein freundlicher 6-Schritte-Assistent führt Kolleginnen und Kollegen beim ersten Besuch Schritt für Schritt durch alle Kernbereiche des Portals und zeigt, wo Sie Apps, die Tafel und Ihre Favoriten finden.',
        badge: 'Einstieg'
      },
      {
        id: 'cl-21-2',
        type: 'neu',
        title: 'QR-Code Tischaufsteller für Schüler (DIN A4 Faltprisma)',
        description: 'Erstellt auf Knopfdruck druckreife Faltaufsteller für die Schülertische. Enthält den direkten WLAN-Zugang fürs Klassenzimmer sowie Schüler-QR-Codes für die Unterrichts-Apps.',
        badge: 'Druckvorlage'
      },
      {
        id: 'cl-21-3',
        type: 'neu',
        title: 'Unterrichts-QuickTools (Seitenleiste)',
        description: 'Ein ausklappbares Schnellmenü an der Seite, mit dem Sie Timer, Ampeln und KI-Einstellungen aufrufen können, ohne die aktuelle Seite zu verlassen.',
        badge: 'Schnellzugriff'
      }
    ]
  },
  {
    version: '2.0.1',
    title: 'Individuelle Startseite, App-Sortierung & Eigene Weblinks',
    date: '17. September 2026',
    highlight: 'Apps frei anordnen, eigene Links abspeichern und persönliche Favoriten-Sterne vergeben.',
    items: [
      {
        id: 'cl-201-1',
        type: 'neu',
        title: 'Apps frei sortieren (Reorder-Modus)',
        description: 'Über den Menüpunkt „Sortieren“ können Sie die Kacheln auf der Startseite mit den Pfeiltasten frei verschieben und nach Ihren Lieblingsfächern oder Vorlieben anordnen.',
        badge: 'Personalisierung'
      },
      {
        id: 'cl-201-2',
        type: 'neu',
        title: 'Eigene Weblinks hinzufügen',
        description: 'Hinterlegen Sie eigene Web-Links (z. B. digitale Schulbücher, Fachportale oder Übungsseiten) direkt auf Ihrer persönlichen Startseite.',
        badge: 'Eigene Links'
      },
      {
        id: 'cl-201-3',
        type: 'neu',
        title: 'Favoriten-Sterne',
        description: 'Mit dem Stern-Symbol auf jeder Kachel heben Sie wichtige Apps hervor, sodass diese immer ganz oben in Ihrer Favoritenleiste bereitstehen.',
        badge: 'Favoriten'
      }
    ]
  },
  {
    version: '2.0.0',
    title: 'Offizieller Start des HBS App-Portals',
    date: '17. September 2026',
    highlight: 'Zentrale Schaltzentrale der Heimbürgeschule mit 26 Tafel-Werkzeugen, HBS Menti, Kahoot und Oncoo.',
    items: [
      {
        id: 'cl-20-1',
        type: 'neu',
        title: 'Gemeinsamer digitaler Hub der Heimbürgeschule',
        description: 'Zentrale Anlaufstelle für Kollegium, Smartboard und Schüler: Bento-Raster (übersichtliche Kachelansicht mit großen Symbolen) und Kompakt-Modus für Smartphones.',
        badge: 'Schulportal'
      },
      {
        id: 'cl-20-2',
        type: 'neu',
        title: 'Digitale Tafel mit 26 Unterrichts-Werkzeugen',
        description: 'Analoge/Digitale Schuluhren, Countdown-Timer, Lärmampel mit Mikrofon, Zufallsrad, Rollo-Vorhang zur Phasenabdeckung und Freihand-Zeichenfläche mit Handballenschutz (Palm Rejection).',
        badge: 'Tafel'
      },
      {
        id: 'cl-20-3',
        type: 'neu',
        title: 'HBS Menti & HBS Kahoot!',
        description: 'Datenschutzkonforme, schuleigene Alternativen zu Mentimeter und Kahoot: Live-Wortwolken, Multiple-Choice-Abfragen und Quizze ohne Schüler-Accounts und ohne Werbung.',
        badge: 'Interaktion'
      },
      {
        id: 'cl-20-4',
        type: 'neu',
        title: 'HBS Oncoo (Kooperative Lernmethoden)',
        description: 'Kooperative Methoden nach Klippert (Helfersystem, Lerntempoduett, Mindmap, Placemat) direkt am Smartboard durchführen.',
        badge: 'Didaktik'
      },
      {
        id: 'cl-20-5',
        type: 'neu',
        title: '3 abgestimmte Zugangsrollen & Datenschutz',
        description: 'Kollegium mit persönlicher 4-stelliger PIN, Gastmodus für Smartboards ohne Login sowie Schulleitungs-Admin. 100% DSGVO-konform ohne Speicherung von Schülerdaten.',
        badge: 'Sicherheit'
      }
    ]
  }
];
