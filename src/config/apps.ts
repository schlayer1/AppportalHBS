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
    id: "kollegiums-handbuch",
    title: "Kollegiums-Handbuch & Guide",
    shortTitle: "Handbuch & Guide",
    subtitle: "Bebilderte Anleitung, Tipps & PDF-Download",
    description: "Das offizielle Handbuch der Heimbürgeschule für das gesamte Kollegium: Ausführliche Anleitungen zu allen Tools, didaktische Praxistipps, Screenshots, Architektur-Erklärung und druckfertige PDF-Version.",
    url: "#handbuch",
    category: "kollegium",
    badge: "Bebildert & PDF",
    badgeColor: "blue",
    icon: "BookOpen",
    tags: ["Handbuch", "Anleitung", "PDF-Download", "Einführung", "Tipps", "Kollegium"],
    isFeaturedStudentQr: false,
    offlineReady: true,
    privacyBadge: "Offizieller Schul-Guide",
    pedagogicalValue: "Unterstützt Kolleginnen und Kollegen beim souveränen Einstieg, liefert Best-Practice-Methoden und erklärt alle Funktionen Schritt für Schritt.",
    quickGuide: [
      "Kachel antippen, um das bebilderte Handbuch direkt im Portal interaktiv zu durchstöbern.",
      "Kapitel für die gewünschte App (Tafel, Menti, Kahoot, Oncoo, Tischaufsteller) auswählen.",
      "Vollständige PDF-Version mit einem Klick herunterladen oder die interaktive Portal-Tour starten."
    ]
  },
  {
    id: "digitale-tafel",
    title: "Digitale Tafel (Classroom-Screen)",
    shortTitle: "Digitale Tafel",
    subtitle: "26 Widgets, Timer, Lärmampel & Zeichenfläche",
    description: "Vollwertige interaktive Schultafel für Smartboards und Tablets mit 26 Unterrichts-Widgets: Timer, Lärmampel, Zufalls-Schülerauswahl, PDF-Viewer, Würfel, Gruppen-Generator und Tafelbild-Export.",
    url: "#tafel",
    category: "unterricht",
    badge: "26 Widgets & Smartboard",
    badgeColor: "teal",
    icon: "Presentation",
    tags: ["Smartboard", "Classroomscreen", "Timer", "Lärmampel", "Zufallsauswahl", "Zeichnen", "Widgets"],
    isFeaturedStudentQr: false,
    offlineReady: true,
    privacyBadge: "100% DSGVO-konform",
    pedagogicalValue: "Strukturiert den Unterrichtsablauf visuell, fördert Aufmerksamkeit und Zeitmanagement und spart wertvolle Vorbereitungszeit.",
    quickGuide: [
      "Kachel antippen oder oben in der Navigationsleiste auf 'Tafel' klicken.",
      "Unten aus dem Dock beliebige Widgets (Uhr, Timer, Zufallsrad, Lärmampel) auf die Tafel ziehen.",
      "Tafelbild bei Bedarf als PDF/Bild speichern oder per QR-Code an Schüler übertragen."
    ]
  },
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
    id: "kahoot-hbs",
    title: "HBS Kahoot! (Quiz & KI-Generator)",
    shortTitle: "HBS Kahoot",
    subtitle: "4-Farben-Quizze, KI-Generator & Live-Podium",
    description: "Authentischer Kahoot-Clone mit Smartboard-Countdown, 4-Farben-Gamepad (🔺🔷🟡🟩), KI-Fragen-Generator für Lehrkräfte und feierlichem 3-Stufen-Siegertreppchen.",
    url: "#kahoot",
    category: "unterricht",
    badge: "Neu: KI & Live",
    badgeColor: "teal",
    icon: "Flame",
    tags: ["Kahoot", "KI-Quiz", "Smartboard", "Wettbewerb", "Podium", "Live-Spiel"],
    isFeaturedStudentQr: true,
    offlineReady: true,
    privacyBadge: "100% DSGVO-konform",
    pedagogicalValue: "Maximale Motivation durch spielerischen Wettbewerb (Gamification), Festigung von Fachwissen und sekundenschnelle KI-Vorbereitung für Lehrkräfte.",
    quickGuide: [
      "Mit '✨ Mit KI generieren' Thema eingeben, Fragen prüfen und mit einem Klick übernehmen.",
      "Auf dem Smartboard 'Live Spielen' starten – Schüler scannen den QR-Code.",
      "Spannende Runden mit 4-Farben-Buttons, Live-Punkten und Siegerehrung auf dem Podest!"
    ]
  },
  {
    id: "hbs-oncoo",
    title: "HBS Oncoo (Kooperative Lernformen)",
    shortTitle: "HBS Oncoo",
    subtitle: "Kartenabfrage, Zielscheibe, Lerntempo & Co.",
    description: "1:1 Clone der beliebten Oncoo-Werkzeuge: Kartenabfrage mit Clustern, Zielscheiben-Feedback, Lerntempoduett (Tandem-Matching), Helfersystem und Placemat-Methode. Ohne Schüler-Login, 100% DSGVO-konform.",
    url: "#oncoo",
    category: "unterricht",
    badge: "5 Methoden",
    badgeColor: "teal",
    icon: "Target",
    tags: ["Oncoo", "Kartenabfrage", "Zielscheibe", "Lerntempoduett", "Helfersystem", "Placemat", "Kooperatives Lernen"],
    isFeaturedStudentQr: true,
    offlineReady: true,
    privacyBadge: "100% DSGVO-konform",
    pedagogicalValue: "Aktiviert kooperative Lernformen nach Heinz Klippert, fördert Binnendifferenzierung und strukturiert Schüleraustausch digital und transparent.",
    quickGuide: [
      "Methode auswählen (Kartenabfrage, Zielscheibe, Lerntempoduett, Helfersystem oder Placemat).",
      "Auf dem Smartboard präsentieren – Schüler scannen den QR-Code oder geben den 6-stelligen PIN ein.",
      "Karten ordnen, Zielscheibe live auswerten oder Tandems und Helfer automatisch matchen."
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
    id: "promptbaukasten",
    title: "KI-Unterrichts-Baukasten & Lernspiel-Werkstatt",
    shortTitle: "Unterrichts-Baukasten",
    subtitle: "Differenzierte Arbeitsblätter, HTML5-Lernspiele & Erwartungshorizonte",
    description: "Didaktisch geschärfter Baukasten für Thüringer Regelschulen (ThILLM & KMK AFB I–III). Generiert druckfertige DIN-A4-Arbeitsblätter, 100% autarke HTML5-Lernspiele mit Sound & Vorlesefunktion sowie transparente Bewertungsraster.",
    url: "https://promptbaukasten.vercel.app/",
    category: "unterricht",
    badge: "ThILLM & HTML5",
    badgeColor: "blue",
    icon: "Sparkles",
    tags: ["Unterricht", "Differenzierung", "HTML5-Lernspiel", "AFB I-III", "Thüringen", "Inklusion", "DaZ", "Moodle-GIFT"],
    isFeaturedStudentQr: true,
    offlineReady: true,
    privacyBadge: "DSGVO-konform",
    pedagogicalValue: "Ermöglicht passgenaue Differenzierung nach Thüringer Operatoren und erzeugt sofort spielbare Tablet-Lernspiele ohne Registrierung.",
    quickGuide: [
      "Fach, Klassenstufe (5–10) und ThILLM-Lehrplanthema auswählen.",
      "Operatoren-Gewichtung nach AFB I–III einstellen und bei Bedarf Fördermodus (DaZ) aktivieren.",
      "Entweder 'Nur Prompt generieren' oder direkt per KI erstellen und das Lernspiel per QR-Code oder HTML-Download an Schüler verteilen."
    ]
  },
  {
    id: "promptbibliothek",
    title: "HBS Promptbibliothek (KI-Zentrale)",
    shortTitle: "Promptbibliothek",
    subtitle: "200+ kuratierte Schul-Prompts, Live-Testarea & Formular-Ausfüller",
    description: "Pädagogische KI-Prompt-Zentrale für das Kollegium: Über 200 praxisnahe Prompts (inkl. Manuel Flick Guide) für Unterricht, Differenzierung und Elternarbeit. Mit interaktiven Variablen-Formularen ([Fach], [Thema]), integrierter Live-Testarea (Google Gemini Kaskade), Multi-KI-Launcher (ChatGPT, Claude, Copilot) und automatischem DSGVO-Schülerdaten-Scanner.",
    url: "https://promptbibliothek.vercel.app/",
    category: "kollegium",
    badge: "Neu: 200+ Prompts",
    badgeColor: "teal",
    icon: "BookOpen",
    tags: ["Kollegium", "Promptbibliothek", "Live-Testarea", "ChatGPT", "Gemini", "DSGVO-Scanner", "Manuel Flick Guide", "Formulare"],
    isFeaturedStudentQr: false,
    offlineReady: true,
    privacyBadge: "100% DSGVO-konform",
    pedagogicalValue: "Strukturierte, erprobte Prompts sparen wertvolle Vorbereitungszeit, verfeinern Unterrichtsideen und verhindern Datenschutzverstöße durch automatische Klarnamen-Prüfung.",
    quickGuide: [
      "In der Schulbibliothek oder im eigenen Bereich den passenden Prompt auswählen.",
      "Variablen wie [Fach], [Klassenstufe] und [Thema] im Formular anpassen – der Prompt setzt sich live zusammen.",
      "Entweder direkt in der integrierten Testarea mit der Schul-KI testen oder mit 1 Klick in ChatGPT, Claude oder Copilot öffnen."
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
    id: "projektkompass-20",
    title: "Projektkompass 2.0",
    shortTitle: "Projektkompass 2.0",
    subtitle: "Agile Projekt-Suite mit KI-Coach & Lehrer-Cockpit",
    description: "Die nächste Generation für anspruchsvolle Gruppen- und Langzeitprojekte: Im Unterschied zur Basis-Version mit Echtzeit-Lehrer-Cockpit (Klassenradar & Live-Hilfe-Ampel), geräteübergreifender Cloud-Synchronisation per Gruppen-Code, didaktischem KI-Projektcoach bei Blockaden, digitalem Projekt-Tagebuch, Meilenstein-Zeitstrahl und fertigem PDF-Druckbericht.",
    url: "https://projektkompass-20.vercel.app",
    category: "unterricht",
    badge: "Neu: KI & Cockpit",
    badgeColor: "teal",
    icon: "Compass",
    tags: ["Lehrer-Cockpit", "Klassen-Radar", "KI-Coach", "Projekt-Tagebuch", "Cloud-Sync", "Meilensteine", "PDF-Druck"],
    isFeaturedStudentQr: true,
    offlineReady: true,
    privacyBadge: "Cloud-Sync & DSGVO",
    pedagogicalValue: "Ermöglicht professionelles selbstorganisiertes Lernen (SOL): Lehrkräfte behalten den Hilfebedarf aller Teams in Echtzeit im Blick, während Schüler durch KI-Impulse und Tagebuch-Reflexion strukturiert durch komplexe Projekte geführt werden.",
    quickGuide: [
      "Schüler treten mit anonymem Team-Code (z. B. PK-8A-01) auf Smartphone oder iPad bei.",
      "Aufgaben per Drag & Drop verwalten, Meilensteine planen und bei Problemen den KI-Coach aktivieren.",
      "Lehrkraft sieht den Fortschritt aller Teams live im Klassenradar des Lehrer-Cockpits.",
      "Am Ende das Projekt-Tagebuch ausfüllen und den Bericht als PDF mit Schulsiegel drucken."
    ]
  },
  {
    id: "projektkompass",
    title: "Projektkompass (Kompakt)",
    shortTitle: "Projektkompass",
    subtitle: "Schlankes Offline-Kanban für den schnellen Einstieg",
    description: "Die leichtgewichtige, rein lokale Basis-Version des Projektkompasses: Funktioniert komplett im Browser ohne Server, Cloud oder Schüler-Codes. Bietet ein einfaches 3-Spalten-Kanban-Board (Zu erledigen, In Arbeit, Erledigt), basale Aufgabenzerlegung und direkten Text-Export für EduPage-Nachrichten. Ideal für unkomplizierte Mini-Aufgaben und Einzelarbeiten.",
    url: "https://schlayer1.github.io/Projektkompass/",
    category: "unterricht",
    badge: "100% Offline",
    badgeColor: "amber",
    icon: "Compass",
    tags: ["100% lokal im Browser", "EduPage-Export", "Einfaches Kanban", "Ohne Login"],
    isFeaturedStudentQr: false,
    offlineReady: true,
    privacyBadge: "Keine Datenübertragung",
    pedagogicalValue: "Niedrigschwelliger Einstieg in die Aufgabenorganisation ohne technische Hürden: Schüler visualisieren ihre nächsten Arbeitsschritte direkt auf dem jeweiligen Gerät.",
    quickGuide: [
      "Thema anlegen und mit dem Zauberstab einfache Teilaufgaben vorschlagen lassen.",
      "Kärtchen im Kanban-Board per Drag & Drop in die Spalten ziehen.",
      "Am Stundenende den Kurzbericht kopieren und in eine EduPage-Nachricht einfügen."
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
