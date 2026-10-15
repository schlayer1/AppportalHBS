export interface AdminAppCredential {
  id: string;
  appName: string;
  shortTitle: string;
  category: 'unterricht' | 'kollegium' | 'verwaltung';
  url: string;
  roles: {
    roleName: string;
    type: 'password' | 'pin' | 'code';
    value: string;
    note?: string;
  }[];
  lastUpdated: string;
  description?: string;
}

export const ADMIN_CREDENTIALS: AdminAppCredential[] = [
  {
    id: "tag-in-der-praxis",
    appName: "Tag in der Praxis (TIP 2.0)",
    shortTitle: "Praxistag",
    category: "unterricht",
    url: "https://tag-in-der-praxis.vercel.app/",
    roles: [
      {
        roleName: "Lehrkraft- / Adminzugang",
        type: "password",
        value: "TIP2026",
        note: "Freischaltung des Lehrer-Cockpits & Auswertungs-Dashboards"
      }
    ],
    lastUpdated: "2026-10-15",
    description: "Digitale Reflexion & Auswertung für den Praxistag der Klassen 8 & 9"
  },
  {
    id: "tip-matching",
    appName: "TIP Matching (TipSwitch)",
    shortTitle: "TIP Matching",
    category: "unterricht",
    url: "https://tipswitch.vercel.app/",
    roles: [
      {
        roleName: "Lehrkraft- / Vermittler-Login",
        type: "password",
        value: "kahla2026",
        note: "Zugriff auf Firmenplätze, Zuweisungen und Schüler-Matchings"
      }
    ],
    lastUpdated: "2026-10-15",
    description: "Matching-Plattform zwischen Schüler-Interessen und regionalen Praktikumsbetrieben"
  },
  {
    id: "vertretungsstatistik",
    appName: "Vertretungsstatistik & AZV",
    shortTitle: "Vertretungsstatistik",
    category: "kollegium",
    url: "https://schlayer1.github.io/Statistik/",
    roles: [
      {
        roleName: "Schulleitungs-Masterpasswort",
        type: "password",
        value: "Year2003?!%",
        note: "Master-Cockpit für Gesamtstatistik, Abrechnung & Export"
      },
      {
        roleName: "Standard-Lehrer-PIN",
        type: "pin",
        value: "1234",
        note: "Initialer PIN für Lehrkräfte am Terminal"
      }
    ],
    lastUpdated: "2026-10-15",
    description: "AZV-Konten, Fehlzeiten- und Mehrarbeitserfassung"
  },
  {
    id: "getraenkefundus",
    appName: "Getränkefundus HBS",
    shortTitle: "Getränkefundus",
    category: "kollegium",
    url: "https://schlayer1.github.io/GetraenkefundusHBS/",
    roles: [
      {
        roleName: "Kassenwart- & Bestands-PIN",
        type: "pin",
        value: "1234",
        note: "Verwaltung von Preisen, Nachbestellungen und Kassenabgleich"
      }
    ],
    lastUpdated: "2026-10-15",
    description: "Digitale Vertrauenskasse für das Lehrerzimmer"
  },
  {
    id: "elternmitmachbogen",
    appName: "Eltern-Mitmachbogen",
    shortTitle: "Mitmachbogen",
    category: "verwaltung",
    url: "https://schlayer1.github.io/Mitmachbogen/",
    roles: [
      {
        roleName: "Admin-Cockpit Passwort",
        type: "password",
        value: "admin123",
        note: "Einsicht aller Eltern-Talente, Angebote und Kontaktdaten"
      }
    ],
    lastUpdated: "2026-10-15",
    description: "Kompetenznetzwerk und Unterstützungsprojekte der Elternschaft"
  }
];
