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
    id: "schueler-translator",
    title: "Schüler-Translator HBS",
    shortTitle: "Schüler-Translator",
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
    title: "Translator HBS (Lehrkräfte)",
    shortTitle: "Translator Kollegium",
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
    url: "https://schlayer1.github.io/Vertretungsstatistik/",
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
    url: "https://tag-in-der-praxis-2-0.vercel.app/",
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
  }
];

export const EXTERNAL_LINKS: ExternalLink[] = [
  {
    id: "edupage",
    title: "EduPage",
    subtitle: "Stundenplan, Vertretungsplan & Noten",
    description: "Zentrales Schulverwaltungs- und Kommunikationssystem der Regelschule Kahla für Lehrkräfte, Eltern und Schüler.",
    url: "https://heimbuergeschule.edupage.org/",
    icon: "GraduationCap",
    badge: "Offizielles Schulsystem"
  },
  {
    id: "schulportal-thueringen",
    title: "Thüringer Schulportal (TSP)",
    subtitle: "Thillm Fortbildungen & Dienste",
    description: "Zentraler Zugang zu den Online-Diensten des Freistaats Thüringen, Thillm-Fortbildungskatalog und amtlichen Verordnungen.",
    url: "https://www.schulportal-thueringen.de/",
    icon: "School",
    badge: "Land Thüringen"
  },
  {
    id: "schul-cloud-thueringen",
    title: "Thüringer Schulcloud (TSC)",
    subtitle: "Digitale Lernumgebung des Freistaats",
    description: "Gemeinsame Dateiablage, Kurse, Aufgaben und datenschutzkonforme Kommunikationsplattform für Thüringer Schulen.",
    url: "https://thueringen.schul-cloud.org/",
    icon: "CloudSun",
    badge: "Lernplattform"
  }
];
