import { MentiPresentation } from '../types/mentiTypes';

export const DEFAULT_MENTI_TEMPLATES: MentiPresentation[] = [
  {
    id: 'tmpl-intro-vorwissen',
    title: 'Stunden-Einstieg: Vorwissen & Assoziationen',
    description: 'Aktivierender Einstieg mit Wortwolke, Wissensabfrage und Skala zum Vorkenntnisstand.',
    subject: 'Fächerübergreifend',
    grade: 'Alle Jahrgänge',
    authorId: 'school-default',
    authorName: 'Heimbürgeschule',
    isShared: true,
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5,
    slides: [
      {
        id: 's-intro-1',
        type: 'wordcloud',
        question: 'Welche 3 Begriffe fallen euch zum heutigen Thema ein?',
        description: 'Tippe bis zu 3 Stichworte in dein Smartphone ein.',
        maxWordsPerUser: 3
      },
      {
        id: 's-intro-2',
        type: 'choice',
        question: 'Wie schätzt du dein Vorwissen zu diesem Bereich ein?',
        options: [
          { id: 'opt-1', text: 'Neuland für mich' },
          { id: 'opt-2', text: 'Ein paar Grundlagen kenne ich' },
          { id: 'opt-3', text: 'Guter Überblick vorhanden' },
          { id: 'opt-4', text: 'Experte! Ich kann es anderen erklären' }
        ]
      },
      {
        id: 's-intro-3',
        type: 'scales',
        question: 'Einschätzung zum heutigen Stundenstart',
        scales: [
          { id: 'sc-1', statement: 'Ich bin heute motiviert für das Thema', lowLabel: 'Gar nicht', highLabel: 'Sehr' },
          { id: 'sc-2', statement: 'Ich habe die Hausaufgaben/Materialien parat', lowLabel: 'Nein', highLabel: 'Ja' },
          { id: 'sc-3', statement: 'Ich möchte heute eine gute Note erarbeiten', lowLabel: 'Egal', highLabel: 'Voll' }
        ]
      }
    ]
  },
  {
    id: 'tmpl-feedback-reflexion',
    title: 'Stunden-Reflexion & Schüler-Feedback',
    description: 'Schnelle 5-Minuten-Rückmeldung am Ende der Unterrichtsstunde.',
    subject: 'Fächerübergreifend',
    grade: 'Alle Jahrgänge',
    authorId: 'school-default',
    authorName: 'Heimbürgeschule',
    isShared: true,
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 4,
    slides: [
      {
        id: 's-fb-1',
        type: 'scales',
        question: 'Wie war die heutige Unterrichtsstunde?',
        scales: [
          { id: 'fb-sc-1', statement: 'Ich habe das Thema heute gut verstanden', lowLabel: 'Wenig', highLabel: 'Voll' },
          { id: 'fb-sc-2', statement: 'Das Unterrichtstempo war passend', lowLabel: 'Zu schnell/langsam', highLabel: 'Genau richtig' },
          { id: 'fb-sc-3', statement: 'Die Aufgaben waren abwechslungsreich', lowLabel: 'Eintönig', highLabel: 'Sehr gut' }
        ]
      },
      {
        id: 's-fb-2',
        type: 'open',
        question: 'Was nimmst du heute besonders mit? (Oder was war noch unklar?)',
        description: 'Schreibe einen kurzen Satz oder eine Frage an die Lehrkraft.'
      },
      {
        id: 's-fb-3',
        type: 'content',
        question: 'Klasse gemacht! Hausaufgaben notieren.',
        description: 'Schulplaner öffnen und Hausaufgaben bis zur nächsten Stunde eintragen.',
        bulletPoints: [
          'Buch S. 54 Aufgaben 1-3 fertigstellen',
          'Arbeitsblatt in den Fachhefter einheften',
          'Schönes Wochenende!'
        ],
        emoji: '⭐'
      }
    ]
  },
  {
    id: 'tmpl-quiz-challenge',
    title: 'Klassen-Quiz: Allgemeinwissen & Natur',
    description: 'Interaktiver Quiz-Wettbewerb mit Timer, Punkten und Live-Treppchen.',
    subject: 'Biologie & Geografie',
    grade: 'Klasse 5 - 8',
    authorId: 'school-default',
    authorName: 'Heimbürgeschule',
    isShared: true,
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
    slides: [
      {
        id: 's-qz-1',
        type: 'quiz',
        question: 'Welches ist der längste Fluss Deutschlands?',
        timeLimitSeconds: 20,
        points: 1000,
        options: [
          { id: 'q1-a', text: 'Donau' },
          { id: 'q1-b', text: 'Rhein', isCorrect: true },
          { id: 'q1-c', text: 'Elbe' },
          { id: 'q1-d', text: 'Saale' }
        ]
      },
      {
        id: 's-qz-2',
        type: 'quiz',
        question: 'Welches Organ pumpt sauerstoffreiches Blut in den Körper?',
        timeLimitSeconds: 20,
        points: 1000,
        options: [
          { id: 'q2-a', text: 'Die Lunge' },
          { id: 'q2-b', text: 'Die Leber' },
          { id: 'q2-c', text: 'Das Herz', isCorrect: true },
          { id: 'q2-d', text: 'Die Niere' }
        ]
      },
      {
        id: 's-qz-3',
        type: 'quiz',
        question: 'Wie viele Kontinente gibt es auf der Erde?',
        timeLimitSeconds: 15,
        points: 1000,
        options: [
          { id: 'q3-a', text: '5 Kontinente' },
          { id: 'q3-b', text: '6 Kontinente' },
          { id: 'q3-c', text: '7 Kontinente', isCorrect: true },
          { id: 'q3-d', text: '8 Kontinente' }
        ]
      }
    ]
  }
];
