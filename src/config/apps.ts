export interface SchoolApp {
  id: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  description: string;
  url: string;
  category: 'kollegium' | 'unterricht' | 'verwaltung' | 'mint';
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
  },
  {
    id: "phet-sims",
    title: "PhET MINT-Simulationen",
    shortTitle: "PhET Simulationen",
    subtitle: "Interaktive Physik, Chemie & Biologie",
    description: "Über 150 weltbekannte HTML5-Simulationen der University of Colorado: Stromkreis-Labor, Energieerhaltung im Skatepark, Atombau, Aggregatzustände, Optik und Evolution. Ideal für Smartboards und Schüler-Tablets.",
    url: "https://phet.colorado.edu/de/simulations/filter?type=html",
    category: "mint",
    badge: "MINT & Labor",
    badgeColor: "teal",
    icon: "Atom",
    tags: ["Physik", "Chemie", "Biologie", "Smartboard", "Simulation", "MINT", "Experimente"],
    isFeaturedStudentQr: true,
    offlineReady: true,
    privacyBadge: "Open Educational Resource",
    pedagogicalValue: "Macht mikroskopische und unsichtbare Naturgesetze (Elektronenfluss, Teilchenbewegung, Molekülaufbau) direkt visuell begreifbar und fördert forschendes Entdecken.",
    quickGuide: [
      "Simulation am Smartboard öffnen oder per QR-Code an die Schüler verteilen.",
      "Parameter (Spannung, Reibung, Temperatur) verändern und Effekte live beobachten.",
      "Gefahrloses Experimentieren ohne teures oder gefährliches Labormaterial."
    ],
    shortcuts: [
      { label: "⚡ Stromkreise (DC)", url: "https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_all.html" },
      { label: "🛹 Skatepark (Energie)", url: "https://phet.colorado.edu/sims/html/energy-skate-park/latest/energy-skate-park_all.html" },
      { label: "🧪 Aggregatzustände", url: "https://phet.colorado.edu/sims/html/states-of-matter/latest/states-of-matter_all.html" },
      { label: "🔬 Atombau", url: "https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom_all.html" }
    ]
  },
  {
    id: "leifiphysik",
    title: "LEIFIphysik",
    shortTitle: "LEIFIphysik",
    subtitle: "Physikportal der Joachim Herz Stiftung",
    description: "Das umfassendste deutsche Portal für den Physikunterricht: Lehrplangerechte Versuche, interaktive HTML5-Modelle, Animationen, Formelsammlungen und gestufte Übungsaufgaben für Klasse 5 bis 10.",
    url: "https://www.leifiphysik.de/",
    category: "mint",
    badge: "Physik 5–10",
    badgeColor: "blue",
    icon: "Zap",
    tags: ["Physik", "Experimente", "Regelschule", "Lehrplan", "Klassenarbeiten", "MINT"],
    isFeaturedStudentQr: true,
    offlineReady: true,
    privacyBadge: "Frei zugänglich",
    pedagogicalValue: "Exakt auf den Thüringer Lehrplan abgestimmte Fachinhalte mit gestuften Hilfen und Aufgaben für differenzierten Unterricht.",
    quickGuide: [
      "Themenbereich (z. B. Mechanik, Optik, Elektrizität) auswählen.",
      "Interaktive Simulationen und animierte Versuchsaufbauten im Unterricht demonstrieren.",
      "Schülern Aufgaben mit gestuften Lösungsschritten zur eigenständigen Übung zuweisen."
    ],
    shortcuts: [
      { label: "Mechanik", url: "https://www.leifiphysik.de/mechanik" },
      { label: "Elektrizitätslehre", url: "https://www.leifiphysik.de/elektrizitaetslehre" },
      { label: "Optik", url: "https://www.leifiphysik.de/optik" },
      { label: "Wärmelehre", url: "https://www.leifiphysik.de/waermelehre" }
    ]
  },
  {
    id: "ptable-pse",
    title: "Ptable Periodensystem",
    shortTitle: "Ptable PSE",
    subtitle: "Interaktives Periodensystem & 3D-Orbitale",
    description: "Modernes interaktives Periodensystem für den Chemieunterricht. Mit dynamischem Temperatur-Schieberegler für Aggregatzustände, Elektronenkonfiguration, Isotopen-Zerfallsketten und 3D-Kristallstrukturen.",
    url: "https://ptable.com/?lang=de",
    category: "mint",
    badge: "Chemie Interaktiv",
    badgeColor: "amber",
    icon: "FlaskConical",
    tags: ["Chemie", "Periodensystem", "PSE", "Smartboard", "Elemente", "MINT"],
    isFeaturedStudentQr: true,
    offlineReady: true,
    privacyBadge: "DSGVO-konform",
    pedagogicalValue: "Macht Trends im Periodensystem (Elektronegativität, Schmelzpunkte, Atomradien) durch dynamische Farbverläufe und Schieberegler sofort nachvollziehbar.",
    quickGuide: [
      "Temperatur-Schieberegler bewegen: Elemente wechseln ihre Farbe nach fest, flüssig oder gasförmig.",
      "Auf ein Element klicken für 3D-Bohr-Modell, Elektronenorbitale und Isotope.",
      "Verbindungsrechner nutzen, um Reaktionen zwischen Elementen zu erforschen."
    ],
    shortcuts: [
      { label: "Aggregatzustände (Temperatur)", url: "https://ptable.com/?lang=de#Property/State" },
      { label: "Elektronen-Orbitale", url: "https://ptable.com/?lang=de#Electrons" },
      { label: "Isotope & Zerfall", url: "https://ptable.com/?lang=de#Isotopes" }
    ]
  },
  {
    id: "molview-chemie",
    title: "MolView 3D-Moleküle",
    shortTitle: "MolView",
    subtitle: "Molekülbaukasten & 3D-Visualisierung",
    description: "Intuitiver 3D-Molekülbaukasten für Chemie. Schüler und Lehrkräfte zeichnen Strukturformeln in 2D und betrachten sie sekundenschnell als rotierbares 3D-Kugel-Stab- oder Kalottenmodell mit echten Bindungswinkeln.",
    url: "https://molview.org/",
    category: "mint",
    badge: "3D-Chemie",
    badgeColor: "teal",
    icon: "Boxes",
    tags: ["Chemie", "Moleküle", "3D-Modell", "Organik", "Kristalle", "MINT"],
    isFeaturedStudentQr: true,
    offlineReady: true,
    privacyBadge: "Open Source",
    pedagogicalValue: "Fördert das räumliche Vorstellungsvermögen für chemische Bindungen, Tetraederwinkel, Kohlenwasserstoffe und funktionelle Gruppen.",
    quickGuide: [
      "Molekül im linken Zeichenfeld mit Stift und Elementen aufbauen (z. B. H2O, Ethanol, Traubenzucker).",
      "Auf '2D to 3D' klicken – das Molekül wird rechts als rotierbares 3D-Modell berechnet.",
      "Darstellungsform umschalten: Ball and Stick, Van der Waals-Kalotten oder Drahtgitter."
    ]
  },
  {
    id: "stellarium-web",
    title: "Stellarium Web",
    shortTitle: "Stellarium",
    subtitle: "3D-Planetarium & Astronomie im Browser",
    description: "Echtzeit-Simulation des Sternenhimmels direkt im Klassenzimmer. Planetenbewegungen, Mondphasen, Sternbilder, Sonnenfinsternisse und Satellitenbahnen für den Physik- und Geografieunterricht.",
    url: "https://stellarium-web.org/",
    category: "mint",
    badge: "Astronomie & Geo",
    badgeColor: "blue",
    icon: "Telescope",
    tags: ["Astronomie", "Physik", "Geografie", "Mondphasen", "Planeten", "3D", "MINT"],
    isFeaturedStudentQr: true,
    offlineReady: true,
    privacyBadge: "Frei zugänglich",
    pedagogicalValue: "Macht Himmelsmechanik, Zeitreisen in die Vergangenheit/Zukunft und den Wechsel der Jahreszeiten aus beliebigen Erdperspektiven erlebbar.",
    quickGuide: [
      "Standort (z. B. Kahla / Jena) festlegen und aktuellen Nachthimmel betrachten.",
      "Zeitraffer beschleunigen, um Planetenläufe und Sternenkreisbewegungen zu demonstrieren.",
      "Sternbildlinien, Deep-Sky-Objekte oder Planeten per Klick heranzoomen."
    ]
  },
  {
    id: "windy-simulation",
    title: "Windy Wetter- & Erdsimulation",
    shortTitle: "Windy Wetter",
    subtitle: "Globale Windströme, Wetterfronten & Klimageografie",
    description: "Spektakuläre, hochauflösende Live-Visualisierung globaler Windsysteme (Passate, Jetstream), Wirbelstürme, Luftdruck, Wolken und Meeresströmungen. Ideal für Geografie- und Physikunterricht.",
    url: "https://www.windy.com/",
    category: "mint",
    badge: "Geografie & Klima",
    badgeColor: "teal",
    icon: "Wind",
    tags: ["Geografie", "Wetter", "Windsysteme", "Klimazonen", "Physik", "Erde", "MINT"],
    isFeaturedStudentQr: true,
    offlineReady: true,
    privacyBadge: "Frei zugänglich",
    pedagogicalValue: "Visualisiert globale Zirkulation, Hoch- und Tiefdruckgebiete sowie thermische Strömungen in verständlicher Echtzeit-Animation.",
    quickGuide: [
      "Zwischen Wind, Temperatur, Regen und Luftdruck im Ebenen-Menü umschalten.",
      "Höhenregler verstellen, um Jetstreams in 10 km Höhe mit Bodenwinden zu vergleichen.",
      "Wettervorhersage für Kahla oder weltweite Klimaphänomene (Monsun, El Niño) untersuchen."
    ]
  },
  {
    id: "geogebra-suite",
    title: "GeoGebra Rechner Suite",
    shortTitle: "GeoGebra",
    subtitle: "Dynamische Mathematik, Graphen & 3D",
    description: "Das weltweit führende Tool für Mathematik und MINT: Funktionsgraphen, Schnittpunkte, Nullstellen, Ableitungen, Vektorgeometrie und 3D-Körper interaktiv auf dem Smartboard berechnen und veranschaulichen.",
    url: "https://www.geogebra.org/calculator",
    category: "mint",
    badge: "Mathe & MINT",
    badgeColor: "blue",
    icon: "Calculator",
    tags: ["Mathematik", "Geometrie", "Funktionen", "Smartboard", "Graph", "MINT"],
    isFeaturedStudentQr: true,
    offlineReady: true,
    privacyBadge: "DSGVO-konform",
    pedagogicalValue: "Verbindet Algebra und Geometrie: Änderungen am Funktionsterm werden im Graphen in Echtzeit sichtbar.",
    quickGuide: [
      "Funktionsgleichung (z. B. f(x) = 2x + 1 oder Parabeln) in die Eingabezeile tippen.",
      "Schieberegler für Parameter m und n erstellen, um Steigungen dynamisch zu animieren.",
      "Nullstellen, Extremwerte und Schnittpunkte per Klick automatisch markieren."
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
