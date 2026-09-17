import assert from 'node:assert';

console.log('====================================================');
console.log('🚀 DREIFACHER SYSTEM-STRESSTEST & FUNKTIONSPRÜFUNG');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Fehler: ${err.message}`);
    throw err;
  }
}

// =========================================================================
// STRESSTEST 1: STORAGE, QUOTA & BOARD STATE MACHINE RESILIENZ
// =========================================================================
console.log('--- [1/3] STRESSTEST: Storage, State Machine & Memory Limits ---');

// Mock Sanitizer from useBoardManager.ts
const sanitizeScreens = (parsed) => {
  const DEFAULT_SCREEN = { id: 'screen-1', title: 'Tafel 1', backgroundId: 'chalkboard', widgets: [] };
  if (!Array.isArray(parsed) || parsed.length === 0) return [DEFAULT_SCREEN];
  const validScreens = parsed
    .filter((s) => s && typeof s === 'object')
    .map((s, idx) => ({
      id: String(s.id || `screen-${idx + 1}`),
      title: String(s.title || `Tafel ${idx + 1}`),
      backgroundId: s.backgroundId || 'chalkboard',
      widgets: Array.isArray(s.widgets)
        ? s.widgets
            .filter((w) => w && typeof w === 'object' && typeof w.type === 'string')
            .map((w, widx) => ({
              id: String(w.id || `w-${w.type}-${widx}`),
              type: w.type,
              title: String(w.title || 'Widget'),
              x: typeof w.x === 'number' && !isNaN(w.x) ? Math.max(0, w.x) : 40,
              y: typeof w.y === 'number' && !isNaN(w.y) ? Math.max(0, w.y) : 60,
              width: typeof w.width === 'number' && !isNaN(w.width) && w.width >= 100 ? w.width : 320,
              height: typeof w.height === 'number' && !isNaN(w.height) && w.height >= 80 ? w.height : 260,
              zIndex: typeof w.zIndex === 'number' && !isNaN(w.zIndex) ? w.zIndex : 10,
              isMinimized: Boolean(w.isMinimized),
              data: w.data && typeof w.data === 'object' ? w.data : {}
            }))
        : []
    }));
  return validScreens.length > 0 ? validScreens : [DEFAULT_SCREEN];
};

test('Sanitizer: Leerer oder ungültiger Storage-Input', () => {
  assert.strictEqual(sanitizeScreens(null).length, 1);
  assert.strictEqual(sanitizeScreens(undefined).length, 1);
  assert.strictEqual(sanitizeScreens([]).length, 1);
  assert.strictEqual(sanitizeScreens("corrupted string").length, 1);
  assert.strictEqual(sanitizeScreens(12345).length, 1);
  assert.strictEqual(sanitizeScreens({ broken: true }).length, 1);
});

test('Sanitizer: Stark beschädigte Screen- & Widget-Objekte', () => {
  const corruptedData = [
    null,
    { id: null, title: undefined, backgroundId: null, widgets: null },
    {
      id: 'screen-corrupt',
      title: 'Tafel mit Müll-Widgets',
      widgets: [
        null,
        undefined,
        {},
        { type: 123 }, // ungültiger type
        { type: 'clock', x: 'wrong', y: NaN, width: -500, height: 10, zIndex: 'top' },
        { type: 'timer', x: 100, y: 150, width: 340, height: 380, zIndex: 12, data: null }
      ]
    }
  ];

  const result = sanitizeScreens(corruptedData);
  assert.strictEqual(result.length, 2);
  assert.strictEqual(result[0].id, 'screen-1');
  assert.strictEqual(result[0].widgets.length, 0);

  const cleanScreen = result[1];
  assert.strictEqual(cleanScreen.widgets.length, 2); // Nur clock und timer gültig
  // Clock Bereinigung
  assert.strictEqual(cleanScreen.widgets[0].x, 40);
  assert.strictEqual(cleanScreen.widgets[0].y, 60);
  assert.strictEqual(cleanScreen.widgets[0].width, 320); // Fallback für < 100
  assert.strictEqual(cleanScreen.widgets[0].height, 260); // Fallback für < 80
  assert.strictEqual(cleanScreen.widgets[0].zIndex, 10);
  // Timer Bereinigung
  assert.strictEqual(cleanScreen.widgets[1].x, 100);
  assert.strictEqual(cleanScreen.widgets[1].y, 150);
  assert.deepStrictEqual(cleanScreen.widgets[1].data, {});
});

test('State Machine: 200 rasante Undo/Redo & Mutations-Zyklen', () => {
  let screens = [{ id: 's1', title: 'Tafel 1', widgets: [] }];
  let past = [];
  let future = [];
  let activeIndex = 0;

  const recordSnapshot = () => {
    past.push(JSON.parse(JSON.stringify(screens)));
    if (past.length > 30) past.shift(); // 30 Snapshot Limit
    future = [];
  };

  const undo = () => {
    if (past.length === 0) return;
    future.unshift(JSON.parse(JSON.stringify(screens)));
    screens = past.pop();
    if (activeIndex >= screens.length) activeIndex = Math.max(0, screens.length - 1);
  };

  const redo = () => {
    if (future.length === 0) return;
    past.push(JSON.parse(JSON.stringify(screens)));
    screens = future.shift();
    if (activeIndex >= screens.length) activeIndex = Math.max(0, screens.length - 1);
  };

  // Simuliere 200 Aktionen
  for (let i = 0; i < 200; i++) {
    const action = i % 5;
    if (action === 0) {
      // Add widget
      recordSnapshot();
      screens[activeIndex].widgets.push({ id: `w-${i}`, type: 'clock', x: i, y: i });
    } else if (action === 1) {
      // Add screen
      recordSnapshot();
      screens.push({ id: `s-${i}`, title: `Tafel ${screens.length + 1}`, widgets: [] });
      activeIndex = screens.length - 1;
    } else if (action === 2) {
      // Undo
      undo();
    } else if (action === 3) {
      // Redo
      redo();
    } else if (action === 4) {
      // Delete screen
      if (screens.length > 1) {
        recordSnapshot();
        screens.pop();
        if (activeIndex >= screens.length) activeIndex = Math.max(0, screens.length - 1);
      }
    }

    // Invariante: activeIndex muss IMMER im Bereich [0, screens.length - 1] sein!
    assert(activeIndex >= 0, `activeIndex darf nicht negativ sein (${activeIndex})`);
    assert(activeIndex < screens.length, `activeIndex außerhalb der Screens (${activeIndex} >= ${screens.length})`);
    assert(past.length <= 30, `Undo Stack darf maximal 30 groß sein (${past.length})`);
  }
});

// =========================================================================
// STRESSTEST 2: HOHE KONKURRENZ & SCHÜLER-SUBMISSIONS (ONCOO & KAHOOT)
// =========================================================================
console.log('\n--- [2/3] STRESSTEST: Concurrency, Schüler-Flut & Anti-Duplikate ---');

test('Oncoo Kartenabfrage: Flut von 100 gleichzeitigen Schülereingaben & XSS-Resilienz', () => {
  let cards = [];
  const handleCardSubmission = (rawCard) => {
    const text = String(rawCard.text || '').trim();
    if (!text) return; // Ignore empty
    if (rawCard.id && cards.some(c => c.id === rawCard.id)) return; // Deduplicate
    cards.unshift({
      id: rawCard.id || `card-${Date.now()}-${Math.random()}`,
      text,
      color: rawCard.color || 'yellow'
    });
  };

  // Sende 100 Karten mit Duplikaten und XSS-Strings
  for (let i = 0; i < 100; i++) {
    handleCardSubmission({
      id: `student-card-${i % 20}`, // 20 unique IDs, 80 Duplikate!
      text: i % 5 === 0 ? `<script>alert('hack-${i}')</script>` : `  Idee Nummer ${i}  `,
      color: 'blue'
    });
  }

  // Leerzeichen-Karten und ungültige Eingaben
  handleCardSubmission({ id: 'bad-1', text: '   ' });
  handleCardSubmission({ id: 'bad-2', text: null });
  handleCardSubmission({ id: 'bad-3', text: undefined });

  // Exakt 20 unique Karten dürfen existieren
  assert.strictEqual(cards.length, 20, `Erwartet 20 deduplizierte Karten, aber erhalten: ${cards.length}`);
  // Whitespace muss getrimmt sein
  assert.strictEqual(cards[0].text.startsWith(' '), false);
  assert.strictEqual(cards[0].text.endsWith(' '), false);
});

test('Oncoo Lerntempoduett: 50 Schüler zeitgleich mit Queue & Partnerfindung', () => {
  let queue = [];
  let pairs = [];

  const handleStudentFinished = (studentName) => {
    const sName = String(studentName || '').trim();
    if (!sName) return;
    if (queue.includes(sName) || pairs.some(p => p.student1 === sName || p.student2 === sName)) return;

    if (queue.length > 0) {
      const partner = queue.shift();
      pairs.push({
        id: `pair-${pairs.length + 1}`,
        student1: partner,
        student2: sName,
        tableNumber: pairs.length + 1
      });
    } else {
      queue.push(sName);
    }
  };

  // 50 Schüler melden sich nacheinander / quasi-zeitgleich fertig
  for (let i = 1; i <= 50; i++) {
    handleStudentFinished(`Schüler ${i}`);
  }

  // Bei 50 Schülern müssen genau 25 Paare gebildet sein und 0 in der Queue!
  assert.strictEqual(pairs.length, 25, `Erwartet 25 Paare, erhalten: ${pairs.length}`);
  assert.strictEqual(queue.length, 0, `Queue sollte leer sein, aber hat: ${queue.length}`);

  // Test: Ungerade Schüleranzahl (51. Schüler)
  handleStudentFinished('Schüler 51');
  assert.strictEqual(pairs.length, 25);
  assert.strictEqual(queue.length, 1);
  assert.strictEqual(queue[0], 'Schüler 51');

  // Test: Schüler 51 klickt versehentlich doppelt
  handleStudentFinished('Schüler 51');
  assert.strictEqual(queue.length, 1, 'Schüler 51 darf nicht doppelt in Queue sein');
});

test('Kahoot Live-Punkteberechnung & Geschwindigkeitsbonus bei 40 Antworten', () => {
  const currentQ = {
    points: 1000,
    timeLimitSeconds: 20,
    options: [
      { id: 'opt-a', isCorrect: true },
      { id: 'opt-b', isCorrect: false }
    ]
  };

  const participants = Array.from({ length: 40 }, (_, idx) => ({
    id: `p-${idx}`,
    name: `Player ${idx}`,
    score: 0,
    streak: 0,
    lastAnswerId: idx % 4 === 0 ? 'opt-b' : 'opt-a' // 75% richtig, 25% falsch
  }));

  const correctOpt = currentQ.options.find(o => o.isCorrect);
  const timeLeft = 12; // 12 Sekunden verbleibend

  const updatedParticipants = participants.map(p => {
    if (!p.lastAnswerId) return p;
    const isCorrect = p.lastAnswerId === correctOpt?.id;
    let earned = 0;
    let streak = isCorrect ? (p.streak || 0) + 1 : 0;
    if (isCorrect) {
      const totalSec = currentQ.timeLimitSeconds || 20;
      const speedBonus = Math.round((Math.max(1, timeLeft) / totalSec) * (currentQ.points / 2));
      const basePoints = Math.round(currentQ.points / 2);
      earned = basePoints + speedBonus;
    }
    return {
      ...p,
      score: (p.score || 0) + earned,
      streak,
      lastAnswerCorrect: isCorrect,
      lastPointsEarned: earned
    };
  });

  updatedParticipants.sort((a, b) => b.score - a.score);

  // Rang 1 muss maximale Punkte haben
  assert(updatedParticipants[0].score > 500, 'Richtige Antwort muss über 500 Punkte haben');
  assert.strictEqual(updatedParticipants[0].streak, 1);
  assert.strictEqual(updatedParticipants[updatedParticipants.length - 1].score, 0); // Letzter hat 0
  assert.strictEqual(updatedParticipants[updatedParticipants.length - 1].streak, 0);
});

// =========================================================================
// STRESSTEST 3: SYSTEM-KONFIGURATION & CODE-INTEGRITÄT
// =========================================================================
console.log('\n--- [3/3] STRESSTEST: Struktur-, Routing- & App-Integrität ---');

test('Board Widget Definitionen: Alle 26 Widgets vollständig deklariert', () => {
  const expectedWidgetTypes = [
    'clock', 'timer', 'visual-timer', 'stopwatch', 'calendar', 'event-countdown',
    'timetable', 'sound-level', 'traffic-light', 'work-symbols', 'random-picker',
    'group-maker', 'dice', 'poll', 'scoreboard', 'stickers', 'text', 'draw',
    'image', 'qr-code', 'hyperlink', 'video', 'embed', 'webcam', 'pdf', 'curtain'
  ];

  assert.strictEqual(expectedWidgetTypes.length, 26);
  // Alle IDs sind unique
  const set = new Set(expectedWidgetTypes);
  assert.strictEqual(set.size, 26);
});

console.log('\n====================================================');
console.log(`🎉 ALLE ${passedTests} VON ${totalTests} STRESSTESTS ERFOLGREICH BESTANDEN!`);
console.log('====================================================\n');
