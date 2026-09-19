import { ChangelogRelease } from '../types/requestTypes';

export const CHANGELOG_RELEASES: ChangelogRelease[] = [
  {
    version: '2.3.0',
    title: 'Kollegiums-Feedback, PWA-Home-Icon & Tafel-Upgrades',
    date: '19. September 2026',
    isLatest: true,
    highlight: 'Eigenes Wunsch- & Requestmodul, Changelog, iPhone-Wischmenü und freie Videowiedergabe.',
    items: [
      {
        id: 'cl-23-1',
        type: 'neu',
        title: 'Wünsche & Feedback Modul (Request-System)',
        description: 'Kolleginnen und Kollegen können direkt über die Menüleiste Anfragen, App-Ideen und Verbesserungsvorschläge einreichen sowie bestehende Ideen unterstützen (Upvote).',
        badge: 'Kollegium'
      },
      {
        id: 'cl-23-2',
        type: 'neu',
        title: 'Interaktiver Versions-Changelog',
        description: 'Vollständige Historie aller Portal-Updates und Funktionserweiterungen auf einen Klick abrufbar.',
        badge: 'Transparenz'
      },
      {
        id: 'cl-23-3',
        type: 'verbessert',
        title: 'Freie Videowiedergabe (MP4, WebM & Streaming)',
        description: 'Das Video-Widget unterstützt neben YouTube nun auch direkte Videodateien (.mp4, .webm, .mov) mit nativem Player sowie Vimeo und Webseiten mit iFrame-Sicherheitshinweis.',
        badge: 'Tafel-Video'
      },
      {
        id: 'cl-23-4',
        type: 'verbessert',
        title: 'Horizontale Wischbarkeit auf dem iPhone',
        description: 'Die Steuerleiste und das Liquid-Glass-Dock der Digitalen Tafel lassen sich auf mobilen Bildschirmen intuitiv mit dem Finger horizontal wischen. Alle Tools sind uneingeschränkt erreichbar.',
        badge: 'Mobile UX'
      },
      {
        id: 'cl-23-5',
        type: 'verbessert',
        title: 'Gestochen scharfes PWA-Icon auf dem Homescreen',
        description: 'Apple-Touch-Icons (180x180) und Android PWA Manifest-Icons generiert. Beim Ablegen auf dem Homescreen von iPhone, iPad und Android wird das offizielle Schulsiegel sauber dargestellt.',
        badge: 'PWA'
      },
      {
        id: 'cl-23-6',
        type: 'behoben',
        title: 'Gastmodus der Tafel bereinigt',
        description: 'Speichern, Vorlagen laden und die Onboarding-Tour sind im Tafel-Gastmodus nun ausgeblendet, um den Fokus auf die pure Unterrichtsnutzung am Smartboard zu legen.',
        badge: 'Gast-Fokus'
      },
      {
        id: 'cl-23-7',
        type: 'verbessert',
        title: 'Echtzeit Cloud-Synchronisation (Firebase Terminkalender)',
        description: 'Anbindung an die Cloud-Sammlung terminkalender-7f269 mit onSnapshot-Listener. Profiländerungen, App-Reihenfolgen und Favoriten synchronisieren sich ohne Verzögerung zwischen iMac, Dienstlaptop und iPhone.',
        badge: 'Cloud Sync'
      }
    ]
  },
  {
    version: '2.2.0',
    title: 'Google Gemini KI-Studio & Zukunftssichere Modelle',
    date: '17. September 2026',
    items: [
      {
        id: 'cl-22-1',
        type: 'neu',
        title: 'Google Gemini 3.6 Flash Integration',
        description: 'Blitzschnelle KI-Erstellung von Multiple-Choice-Quizzen für Kahoot und interaktiven Folien für Menti.',
        badge: 'KI'
      },
      {
        id: 'cl-22-2',
        type: 'verbessert',
        title: 'Automatische Modell-Kaskade',
        description: 'Erkennt verfügbare Gemini-Modelle dynamisch und filtert abgeschaltete Altmodelle vollautomatisch heraus.',
        badge: 'Stabilität'
      }
    ]
  },
  {
    version: '2.1.0',
    title: 'Interaktive Portal-Tour & Bebildertes Handbuch',
    date: '16. September 2026',
    items: [
      {
        id: 'cl-21-1',
        type: 'neu',
        title: 'Onboarding-Assistent',
        description: '6-Schritte-Führung durch alle Kernbereiche beim ersten Start.',
        badge: 'Einstieg'
      },
      {
        id: 'cl-21-2',
        type: 'neu',
        title: 'Druckfertiges DIN-A4 Handbuch',
        description: '8 MB PDF-Handbuch für das Kollegium mit didaktischen Praxisszenarien.',
        badge: 'PDF'
      }
    ]
  },
  {
    version: '2.0.0',
    title: 'Digitales App-Portal der Heimbürgeschule',
    date: 'Schuljahr 2026/2027',
    items: [
      {
        id: 'cl-20-1',
        type: 'neu',
        title: 'Bento-Grid & Kompaktmodus',
        description: 'Moderne Schaltzentrale für Kollegium, Smartboard und Unterricht mit 26 Widgets, Menti, Kahoot und Oncoo.',
        badge: 'Portal'
      }
    ]
  }
];
