import { KahootGame } from '../types/kahootTypes';

export const DEFAULT_KAHOOT_GAMES: KahootGame[] = [
  {
    id: 'kahoot-mathe-kopfrechnen',
    title: 'Mathe-Sprint: Kopfrechnen & Bruchrechnung',
    description: 'Rasantes Quiz zu Grundrechenarten, Potenzen und einfachen Brüchen.',
    subject: 'Mathematik',
    grade: 'Klasse 6 - 8',
    authorId: 'school-default',
    authorName: 'Heimbürgeschule',
    isShared: true,
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
    timesPlayed: 14,
    questions: [
      {
        id: 'km-1',
        question: 'Was ergibt 15% von 200?',
        timeLimitSeconds: 20,
        points: 1000,
        type: 'quiz',
        options: [
          { id: 'km1-o1', text: '25', isCorrect: false, shape: 'triangle', color: 'red' },
          { id: 'km1-o2', text: '30', isCorrect: true, shape: 'diamond', color: 'blue' },
          { id: 'km1-o3', text: '35', isCorrect: false, shape: 'circle', color: 'yellow' },
          { id: 'km1-o4', text: '40', isCorrect: false, shape: 'square', color: 'green' }
        ],
        explanation: '10% von 200 sind 20, 5% sind 10. Zusammen: 30.'
      },
      {
        id: 'km-2',
        question: 'Welcher Bruch ist gleichwertig zu 3/4?',
        timeLimitSeconds: 20,
        points: 1000,
        type: 'quiz',
        options: [
          { id: 'km2-o1', text: '6/8', isCorrect: true, shape: 'triangle', color: 'red' },
          { id: 'km2-o2', text: '9/15', isCorrect: false, shape: 'diamond', color: 'blue' },
          { id: 'km2-o3', text: '7/10', isCorrect: false, shape: 'circle', color: 'yellow' },
          { id: 'km2-o4', text: '12/20', isCorrect: false, shape: 'square', color: 'green' }
        ],
        explanation: '3/4 mit 2 erweitert ergibt 6/8.'
      },
      {
        id: 'km-3',
        question: 'Wahr oder Falsch: Die Zahl 1 ist eine Primzahl.',
        timeLimitSeconds: 15,
        points: 1000,
        type: 'true_false',
        options: [
          { id: 'km3-o1', text: 'Wahr', isCorrect: false, shape: 'diamond', color: 'blue' },
          { id: 'km3-o2', text: 'Falsch', isCorrect: true, shape: 'triangle', color: 'red' }
        ],
        explanation: 'Eine Primzahl muss genau zwei verschiedene Teiler haben (1 und sich selbst). Die 1 hat nur einen Teiler.'
      }
    ]
  },
  {
    id: 'kahoot-geschichte-rom',
    title: 'Geschichte: Das Römische Reich',
    description: 'Spannendes Quiz über Cäsar, Gladiatoren, das Kolosseum und die Republik.',
    subject: 'Geschichte',
    grade: 'Klasse 6',
    authorId: 'school-default',
    authorName: 'Heimbürgeschule',
    isShared: true,
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
    timesPlayed: 22,
    questions: [
      {
        id: 'kr-1',
        question: 'Welcher Fluss fließt durch Rom?',
        timeLimitSeconds: 20,
        points: 1000,
        type: 'quiz',
        options: [
          { id: 'kr1-o1', text: 'Po', isCorrect: false, shape: 'triangle', color: 'red' },
          { id: 'kr1-o2', text: 'Tiber', isCorrect: true, shape: 'diamond', color: 'blue' },
          { id: 'kr1-o3', text: 'Arno', isCorrect: false, shape: 'circle', color: 'yellow' },
          { id: 'kr1-o4', text: 'Rubikon', isCorrect: false, shape: 'square', color: 'green' }
        ]
      },
      {
        id: 'kr-2',
        question: 'Wer waren laut der Sage die Gründer Roms?',
        timeLimitSeconds: 20,
        points: 1000,
        type: 'quiz',
        options: [
          { id: 'kr2-o1', text: 'Romulus und Remus', isCorrect: true, shape: 'triangle', color: 'red' },
          { id: 'kr2-o2', text: 'Cäsar und Augustus', isCorrect: false, shape: 'diamond', color: 'blue' },
          { id: 'kr2-o3', text: 'Jupiter und Mars', isCorrect: false, shape: 'circle', color: 'yellow' },
          { id: 'kr2-o4', text: 'Spartacus und Nero', isCorrect: false, shape: 'square', color: 'green' }
        ]
      },
      {
        id: 'kr-3',
        question: 'Wozu diente das Kolosseum in Rom vor allem?',
        timeLimitSeconds: 20,
        points: 1000,
        type: 'quiz',
        options: [
          { id: 'kr3-o1', text: 'Als Tempel für Götter', isCorrect: false, shape: 'triangle', color: 'red' },
          { id: 'kr3-o2', text: 'Als Senatsgebäude', isCorrect: false, shape: 'diamond', color: 'blue' },
          { id: 'kr3-o3', text: 'Für Gladiatoren- und Tierkämpfe', isCorrect: true, shape: 'circle', color: 'yellow' },
          { id: 'kr3-o4', text: 'Als kaiserlicher Wohnpalast', isCorrect: false, shape: 'square', color: 'green' }
        ]
      }
    ]
  }
];
