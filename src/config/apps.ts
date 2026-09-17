export interface SchoolApp {
  id: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  description: string;
  url: string;
  category: 'kollegium' | 'unterricht' | 'verwaltung';
  badge: string;
  badgeColor: 'blue' | 'amber' | 'teal' | 'slate';
  icon: string; // Lucide icon name
  tags: string[];
  isFeaturedStudentQr?: boolean;
  offlineReady?: boolean;
  privacyBadge?: string;
  pedagogicalValue?: string;
  quickGuide?: string[];
  shortcuts?: { label: string; url: string }[];
}

export interface ExternalLink {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  url: string;
  icon: string;
  badge: string;
}

export const PORTAL_CONFIG = {
  schoolName: "Staatliche Regelschule Heimbürgeschule",
  schoolLocation: "Kahla",
  portalTitle: "HBS App-Portal",
  portalSubtitle: "Zentraler Anlaufpunkt für Kollegium, Unterricht und Schulverwaltung",
  portalPassword: "HBS2025!",
  contactEmail: "schulleitung@regelschule-kahla.de"
};

export const SCHOOL_APPS: SchoolApp[] = [
  {
    id: "menti-hbs",
    title: "HBS Menti (Live-Abfragen)",
    shortTitle: "HBS Menti",
    subtitle: "Wortwolken, Live-Votings & Quiz-Wettbewerbe",
    description: "Mentimeter-Clone für interaktive Unterrichtsfolien. Schüler stimmen per Smartphone oder iPad via QR-Code live ab. Mit Wortwolke, Multiple-Choice, Skalen und Quiz.",
    url: "#menti",
    category: "unterricht",
    badge: "Interaktiv & Live",
    badgeColor: "teal",
    icon: "BarChart2",
    tags: ["Unterricht", "Wortwolke", "Abstimmung", "Quiz", "QR-Code", "Smartboard"],
    isFeaturedStudentQr: true,
    offlineReady: true,
    privacyBadge: "100% DSGVO-konform",
    pedagogicalValue: "Aktiviert die gesamte Klasse, erfasst Vorwissen und Meinungsbilder sekundenschnell und macht Lernstände transparent.",
    quickGuide: [
      "In HBS Menti auf 'Präsentieren' klicken, um das Smartboard zu starten.",
      "Schüler scannen den QR-Code oder tippen den 6-stelligen PIN ein.",
      "Ergebnisse wachsen live in Echtzeit als Wortwolke oder animierte Balken."
    ]
  },
  {
    id: "schueler-translator",
    title: "Übersetzer Schüler",
    shortTitle: "Übersetzer Schüler",
    subtitle: "Sprachbrücke für Unterricht & DaZ",
    description: "Schlanker, intuitiver Übersetzer für Schülerinnen und Schüler im Unterricht. Ideal für DaZ-Klassen und Sprachförderung per Schnellscan.",
    url: "https://schueler-translator-hbs.vercel.app/",
    category: "unterricht",
    badge: "Schüler & Unterricht",
    badgeColor: "amber",
    icon: "Languages",
    tags: ["Unterricht", "DaZ", "QR-Sofortscan", "Smartphone & iPad"],
    isFeaturedStudentQr: true,
    offlineReady: true,
    privacyBadge: "DSGVO-optimiert",
    pedagogicalValue: "Baut sprachliche Barrieren im Fachunterricht sofort ab und ermöglicht DaZ-Schülern eigenständiges Arbeiten.",
    quickGuide: [
      "QR-Code an die Wand projizieren oder Schülern zeigen.",
      "Schüler scannen den Code mit Schul-iPad oder Smartphone.",
      "Sprachausgabe und einfache Textübersetzung sofort einsatzbereit."
    ]
  },
  {
    id: "lehrer-translator",
    title: "Übersetzer Lehrer",
    shortTitle: "Übersetzer Lehrer",
    subtitle: "Dolmetscher für Eltern- & Fachgespräche",
    description: "Professioneller KI-Sprachmittler mit 2-Wege-Audio, geteiltem Bildschirmmodus und Sprachausgabe für Elterngespräche und Schulanmeldungen.",
    url: "https://translator-hbs.vercel.app/",
    category: "kollegium",
    badge: "Kollegium & Beratung",
    badgeColor: "blue",
    icon: "Headphones",
    tags: ["Elterngespräche", "2-Wege-Audio", "Dolmetscher"],
    offlineReady: true,
    privacyBadge: "DSGVO-konform",
    pedagogicalValue: "Souveräne, empathische Verständigung mit Eltern bei Entwicklungs- und Schullaufbahngesprächen ohne Sprachbarriere.",
    quickGuide: [
      "Zwischen zwei Sprachen wählen (z. B. Deutsch ↔ Ukrainisch/Arabisch).",
      "Mikrofon-Button antippen und ganz normal sprechen.",
      "Die KI übersetzt und liest die Übersetzung in natürlicher Stimme vor."
    ]
  },
  {
    id: "getraenkefundus",
    title: "Getränkefundus HBS",
    shortTitle: "Getränkefundus",
    subtitle: "Digitale Vertrauenskasse & Kaffeekasse",
    description: "Bequeme Erfassung von Heiß- und Kaltgetränken, Snacks sowie Guthaben-Verwaltung für das Lehrerzimmer. Mit Barcode- und Kassenstand-Support.",
    url: "https://schlayer1.github.io/GetraenkefundusHBS/",
    category: "kollegium",
    badge: "Lehrerzimmer",
    badgeColor: "teal",
    icon: "Coffee",
    tags: ["Lehrerzimmer", "Vertrauenskasse", "Guthaben"],
    offlineReady: true,
    privacyBadge: "Schulintern",
    pedagogicalValue: "Stärkt die Gemeinschaft im Lehrerzimmer durch transparente, faire und unkomplizierte Kaffee- & Snack-Abrechnung.",
    quickGuide: [
      "Im Lehrerzimmer aufrufen oder als PWA auf dem Smartphone speichern.",
      "Getränk oder Snack per Klick auswählen.",
      "Guthaben aufladen (Bar oder digital) und Kassenstand einsehen."
    ]
  },
  {
    id: "vertretungsstatistik",
    title: "Vertretungsstatistik & AZV",
    subtitle: "Fehlzeiten, Mehrarbeit & AZV-Konten",
    shortTitle: "Vertretungsstatistik",
    description: "Dezentrale Erfassung von Ausfall- und Vertretungsstunden für das Kollegium im geschützten Kiosk-Modus und Cockpit für die Schulleitung.",
    url: "https://schlayer1.github.io/Statistik/",
    category: "kollegium",
    badge: "Kollegium & Leitung",
    badgeColor: "blue",
    icon: "CalendarDays",
    tags: ["Vertretung", "AZV-Konto", "Kiosk-Modus", "Firebase Cloud"],
    offlineReady: true,
    privacyBadge: "PIN-geschützt",
    pedagogicalValue: "Transparente und gerechte Dokumentation von Unterrichtsausfall, Mehrbelastung und Arbeitszeitkonten.",
    quickGuide: [
      "Lehrkraft wählt den eigenen Namen und gibt die 4-stellige PIN ein.",
      "Vertretungsstunden oder Abwesenheiten eintragen.",
      "Schulleitung hat den Gesamtüberblick im Master-Adminbereich."
    ]
  },
  {
    id: "tag-in-der-praxis",
    title: "Tag in der Praxis",
    shortTitle: "Praxistag",
    subtitle: "Reflexion & Berufsorientierung",
    description: "Begleit-App für den Praxistag der Regelschüler: Tagesreflexion, Kompetenzerfassung, Masterprompts und Auswertungs-Dashboard für Lehrkräfte.",
    url: "https://tag-in-der-praxis.vercel.app/",
    category: "unterricht",
    badge: "Praxistag & BO",
    badgeColor: "teal",
    icon: "Briefcase",
    tags: ["Berufsorientierung", "Schüler-Reflexion", "Lehrer-Dashboard"],
    offlineReady: true,
    privacyBadge: "Cloud-Sync",
    pedagogicalValue: "Fördert die berufliche Selbstreflexion und liefert Lehrkräften fundierte Rückmeldungen aus den Praktikumsbetrieben.",
    quickGuide: [
      "Schüler füllen am Praxistag die digitale Reflexion aus.",
      "KI liefert sofortiges pädagogisches Feedback zur Dokumentation.",
      "Betreuende Lehrkräfte prüfen die Fortschritte im Lehrer-Dashboard."
    ]
  },
  {
    id: "projektkompass",
    title: "Projektkompass",
    shortTitle: "Projektkompass",
    subtitle: "Agile Projektarbeit & Aufgaben-Board",
    description: "Strukturiertes Kanban-Werkzeug für Schülergruppen. Generiert Aufgaben-Checklisten per Zauberstab und fertige Statusberichte für EduPage.",
    url: "https://schlayer1.github.io/Projektkompass/",
    category: "unterricht",
    badge: "Schülerteams",
    badgeColor: "amber",
    icon: "Compass",
    tags: ["100% lokal im Browser", "EduPage-Export", "Gruppenarbeit"],
    offlineReady: true,
    privacyBadge: "Keine Datenübertragung",
    pedagogicalValue: "Trainiert selbstorganisiertes Lernen (SOL), Teamwork und metakognitive Planung bei Projektarbeiten und Referaten.",
    quickGuide: [
      "Thema anlegen und mit dem Zauberstab Teilaufgaben generieren.",
      "Aufgaben im Kanban-Board per Drag & Drop verschieben.",
      "Am Ende der Stunde Statusbericht kopieren und in EduPage einreichen."
    ]
  },
  {
    id: "elternmitmachbogen",
    title: "Eltern-Mitmachbogen",
    shortTitle: "Mitmachbogen",
    subtitle: "Kompetenznetzwerk & Schulförderung",
    description: "Digitales Mitmach- und Talentnetzwerk der Heimbürgeschule: Eltern erfassen Berufsfelder, Hobbys und Hilfsangebote für Schulprojekte, AGs und Feste. Inklusive geschütztem Admin-Cockpit.",
    url: "https://schlayer1.github.io/Mitmachbogen/",
    category: "verwaltung",
    badge: "Eltern & Netzwerk",
    badgeColor: "teal",
    icon: "HeartHandshake",
    tags: ["Elternarbeit", "Kompetenznetzwerk", "Berufsorientierung", "Schulprojekte", "Admin-Cockpit"],
    offlineReady: true,
    privacyBadge: "DSGVO-konform",
    pedagogicalValue: "Aktiviert die vielfältigen Ressourcen der Elternschaft für lebensnahen Fachunterricht, AGs, Praxistage und schulische Veranstaltungen.",
    quickGuide: [
      "Eltern füllen den digitalen Bogen zu Interessen, Fachwissen und Hilfsangeboten aus.",
      "Erhalten einen persönlichen Bearbeitungscode zur jederzeitigen Aktualisierung.",
      "Kollegium und Schulleitung finden im geschützten Admin-Bereich zielgenau Unterstützung."
    ]
  }
];

export const EXTERNAL_LINKS: ExternalLink[] = [
  {
    id: "edupage",
    title: "EduPage",
    subtitle: "Stundenplan, Vertretungsplan & Noten",
    description: "",
    url: "https://regelschule-kahla.edupage.org/",
    icon: "GraduationCap",
    badge: "Schulsystem"
  },
  {
    id: "schulportal-thueringen",
    title: "TSP",
    subtitle: "Thüringer Schulportal",
    description: "",
    url: "https://schulportal-thueringen.de/start",
    icon: "School",
    badge: "Land Thüringen"
  },
  {
    id: "schul-cloud-thueringen",
    title: "TSC",
    subtitle: "Thüringer Schulcloud",
    description: "",
    url: "https://schulportal-thueringen.de/thueringer_schulcloud/startseite_thueringer_schulcloud",
    icon: "CloudSun",
    badge: "Lernplattform"
  }
];
