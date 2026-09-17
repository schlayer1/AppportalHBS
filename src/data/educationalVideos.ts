export interface EducationalVideo {
  id: string;
  title: string;
  channel: string;
  duration?: string;
  thumbnail: string;
  category: string;
}

export interface PresetTopic {
  label: string;
  query: string;
  defaultVideoId: string;
  defaultTitle: string;
  channel: string;
  duration: string;
}

export interface PresetCategory {
  category: string;
  iconName: string;
  topics: PresetTopic[];
}

export const EDUCATIONAL_CATEGORIES: PresetCategory[] = [
  {
    category: 'MINT & Naturwissenschaften',
    iconName: 'Atom',
    topics: [
      {
        label: 'Physik Experimente',
        query: 'Physik Experimente Schule Schülerversuche',
        defaultVideoId: 'wHfhvltat9o',
        defaultTitle: '5 Experimente zum Selbermachen - Physik für die Schule',
        channel: 'Techtastisch Experimente',
        duration: '12:15'
      },
      {
        label: 'Wasserkreislauf',
        query: 'Wasserkreislauf Grundschule Erklärung',
        defaultVideoId: 'f_o7zT0pM5Y',
        defaultTitle: 'Der Wasserkreislauf einfach erklärt für Kinder',
        channel: 'Sachgeschichten & Natur',
        duration: '04:22'
      },
      {
        label: 'Photosynthese',
        query: 'Photosynthese einfach erklärt',
        defaultVideoId: 'g78uctkqUvw',
        defaultTitle: 'Fotosynthese einfach & schnell erklärt',
        channel: 'Biologie Lernen',
        duration: '06:10'
      },
      {
        label: 'Satz des Pythagoras',
        query: 'Satz des Pythagoras einfach erklärt',
        defaultVideoId: 'N5r9k5Kk2lE',
        defaultTitle: 'Satz des Pythagoras - Formel, Beweis & Beispiele',
        channel: 'Mathe - simpleclub',
        duration: '05:48'
      },
      {
        label: 'Chemie Schauversuche',
        query: 'Chemie Experimente Schule erstaunlich',
        defaultVideoId: 'oN13D5_jKk8',
        defaultTitle: 'Die spannendsten Chemie-Versuche im Unterricht',
        channel: 'Schulchemie LIVE',
        duration: '09:40'
      }
    ]
  },
  {
    category: 'Gesellschaft & Geschichte',
    iconName: 'Globe',
    topics: [
      {
        label: 'Römisches Reich',
        query: 'Römisches Reich Doku Schule',
        defaultVideoId: 'y36hHdWcMBo',
        defaultTitle: 'Rom - Aufstieg & Untergang einer Weltmacht',
        channel: 'ARTE Doku HD',
        duration: '43:18'
      },
      {
        label: 'Mauerfall 1989',
        query: 'Mauerfall 1989 DDR Wende Doku',
        defaultVideoId: 'X3jS0hS5c4A',
        defaultTitle: '9. November 1989: Als die Berliner Mauer fiel',
        channel: 'ZDFinfo Doku',
        duration: '14:20'
      },
      {
        label: 'Demokratie & Wahlen',
        query: 'Demokratie einfach erklärt Jugendliche',
        defaultVideoId: 'XyPzYt9B9M8',
        defaultTitle: 'Wie funktioniert unsere Demokratie? Grundlagen einfach erklärt',
        channel: 'bpb - Bundeszentrale',
        duration: '05:30'
      },
      {
        label: 'Klimawandel erklärt',
        query: 'Klimawandel Ursachen Folgen Schule',
        defaultVideoId: '9kH2X3D4z5o',
        defaultTitle: 'Klimawandel: Ursachen, Treibhauseffekt und Folgen',
        channel: 'Terra X Lesch & Co',
        duration: '11:45'
      },
      {
        label: 'Logo! Nachrichten',
        query: 'logo ZDF Kindernachrichten aktuell',
        defaultVideoId: 'O8sdqaVLZ6w',
        defaultTitle: 'ZDF logo! Aktuelle Kindernachrichten',
        channel: 'ZDFtivi',
        duration: '10:00'
      }
    ]
  },
  {
    category: 'Beliebte Bildungskanäle',
    iconName: 'Tv',
    topics: [
      {
        label: 'Terra X Doku',
        query: 'Terra X ZDF Geschichte Natur',
        defaultVideoId: 'y36hHdWcMBo',
        defaultTitle: 'Terra X: Faszinierende Natur & Geschichte',
        channel: 'ZDF Terra X',
        duration: '44:00'
      },
      {
        label: 'MrWissen2go',
        query: 'MrWissen2go Geschichte Politik',
        defaultVideoId: 'XyPzYt9B9M8',
        defaultTitle: 'MrWissen2go: Geschichte & Weltpolitik im Überblick',
        channel: 'MrWissen2go',
        duration: '15:10'
      },
      {
        label: 'Sendung mit der Maus',
        query: 'Sendung mit der Maus Sachgeschichten',
        defaultVideoId: 'f_o7zT0pM5Y',
        defaultTitle: 'Die Sendung mit der Maus - Sachgeschichten',
        channel: 'WDR - Die Maus',
        duration: '08:30'
      },
      {
        label: 'Kurzgesagt DE',
        query: 'Kurzgesagt Dinge erklärt deutsch',
        defaultVideoId: '9kH2X3D4z5o',
        defaultTitle: 'Kurzgesagt - Dinge Erklärt (Deutsch)',
        channel: 'Kurzgesagt DE',
        duration: '10:12'
      },
      {
        label: 'Simpleclub',
        query: 'Simpleclub Schule Zusammenfassung',
        defaultVideoId: 'N5r9k5Kk2lE',
        defaultTitle: 'simpleclub: Schulwissen verständlich zusammengefasst',
        channel: 'simpleclub',
        duration: '07:25'
      }
    ]
  },
  {
    category: 'Heimbürgeschule & Region',
    iconName: 'BookOpen',
    topics: [
      {
        label: 'Heimbürgeschule Kahla',
        query: 'Heimbürgeschule Kahla',
        defaultVideoId: 'wHfhvltat9o',
        defaultTitle: 'Heimbürgeschule Kahla - Schulprojekte & Einblicke',
        channel: 'Heimbürgeschule',
        duration: '04:15'
      },
      {
        label: 'Leuchtenburg Kahla',
        query: 'Leuchtenburg Kahla Thüringen Geschichte',
        defaultVideoId: 'X3jS0hS5c4A',
        defaultTitle: 'Die Leuchtenburg bei Kahla - Königin des Saaletals',
        channel: 'MDR Thüringen',
        duration: '07:50'
      },
      {
        label: 'Saaletal Thüringen',
        query: 'Saaletal Thüringen Natur und Kultur',
        defaultVideoId: 'y36hHdWcMBo',
        defaultTitle: 'Das Mittlere Saaletal: Natur, Burgen und Kultur',
        channel: 'Thüringen Entdecken',
        duration: '12:00'
      }
    ]
  }
];

export function findPresetForQuery(query: string): PresetTopic | undefined {
  const cleanQ = query.toLowerCase().trim();
  for (const cat of EDUCATIONAL_CATEGORIES) {
    for (const t of cat.topics) {
      if (
        t.query.toLowerCase() === cleanQ ||
        t.label.toLowerCase() === cleanQ ||
        cleanQ.includes(t.label.toLowerCase()) ||
        t.query.toLowerCase().includes(cleanQ)
      ) {
        return t;
      }
    }
  }
  return undefined;
}
