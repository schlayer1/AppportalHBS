// Global fetch is built-in in Node 18+

const GEMINI_KEY = Buffer.from('QVEuQWI4Uk42SUpRQTM1V0ZScTRfLTdsUFAxQVU1Y1l5bkVTN3VmekZjdjlyZktHMjhhV2c=', 'base64').toString('utf8');

const CANDIDATE_MODELS = [
  'gemini-flash-latest',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
];

async function executeCascadeRequest(prompt, jsonMode = false) {
  let lastError = null;
  for (const model of CANDIDATE_MODELS) {
    try {
      const bodyPayload = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048
        }
      };
      if (jsonMode) {
        bodyPayload.generationConfig.responseMimeType = 'application/json';
      }

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return { text, modelUsed: model };
        }
      } else {
        const err = await res.json().catch(() => ({}));
        lastError = new Error(`${model}: HTTP ${res.status} - ${err.error?.message || ''}`);
      }
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error('Kein Modell erreichbar');
}

console.log('========================================');
console.log('  HBS APP-PORTAL: GEMINI KI TEST');
console.log('========================================\n');

async function runTests() {
  let passed = 0;
  let total = 4;

  // Test 1: Key & Model Discovery
  console.log('[Test 1/4] Abfrage der Modell-Liste bei Google API...');
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_KEY}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const rawModels = data.models || [];
    console.log(`✓ Google API erreichbar, ${rawModels.length} Rohmodelle gefunden.`);

    const DISCONTINUED = ['2.5-flash', '2.5-pro', '1.5-flash', '1.5-pro', '2.0-flash', '8b', 'embedding', 'tts', 'image'];
    const filtered = rawModels
      .filter(m => {
        const name = (m.name || '').toLowerCase();
        const methods = m.supportedGenerationMethods || [];
        if (!methods.includes('generateContent')) return false;
        for (const d of DISCONTINUED) {
          if (name.includes(d)) return false;
        }
        return true;
      })
      .map(m => m.name.replace(/^models\//, ''));

    console.log(`✓ Nach Filterung verbleiben ${filtered.length} zukunftssichere Modelle.`);
    console.log(`  Top-Modelle: ${filtered.slice(0, 5).join(', ')}`);
    if (filtered.includes('gemini-3.6-flash') || filtered.includes('gemini-flash-latest')) {
      console.log('✓ Test 1 BESTANDEN: gemini-3.6-flash / flash-latest verifiziert.\n');
      passed++;
    } else {
      throw new Error('Kein modernes Flash-Modell in den gefilterten Modellen gefunden.');
    }
  } catch (err) {
    console.error('✗ Test 1 FEHLGESCHLAGEN:', err.message);
  }

  // Test 2: Live-Generierung mit Kaskade
  console.log('[Test 2/4] Live-Generierung mit Kaskadierung...');
  try {
    const startTime = Date.now();
    const res = await executeCascadeRequest('Antworte mit genau einem kurzen Satz: "Das System ist bereit für den Unterricht."');
    const latency = Date.now() - startTime;
    console.log(`✓ Modell "${res.modelUsed}" antwortete in ${latency} ms:`);
    console.log(`  "${res.text.trim()}"`);
    if (res.text.length > 0) {
      console.log('✓ Test 2 BESTANDEN.\n');
      passed++;
    } else {
      throw new Error('Leere Antwort erhalten.');
    }
  } catch (err) {
    console.error('✗ Test 2 FEHLGESCHLAGEN:', err.message);
  }

  // Test 3: Kahoot Multiple-Choice Quiz Generation (Striktes JSON)
  console.log('[Test 3/4] Generierung von 2 Quizfragen für Kahoot (Fach: Physik, Kl. 7)...');
  try {
    const prompt = `Du bist Lehrer an der Heimbürgeschule Kahla.
Erstelle genau 2 Multiple-Choice Fragen zum Thema "Auftrieb und Dichte" für Klasse 7.
Antworte STRIKT als valides JSON-Array ohne Markdown-Backticks:
[
  {
    "question": "Frage?",
    "options": [
      { "text": "Richtige Antwort", "isCorrect": true },
      { "text": "Falsche Option 1", "isCorrect": false },
      { "text": "Falsche Option 2", "isCorrect": false },
      { "text": "Falsche Option 3", "isCorrect": false }
    ],
    "explanation": "Erklärung",
    "timeLimitSeconds": 20
  }
]`;
    const res = await executeCascadeRequest(prompt, true);
    const clean = res.text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(clean);
    if (Array.isArray(parsed) && parsed.length === 2 && parsed[0].options.length === 4) {
      console.log(`✓ 2 Fragen erfolgreich via "${res.modelUsed}" generiert:`);
      console.log(`  Q1: "${parsed[0].question}"`);
      console.log(`  Korrekte Option: "${parsed[0].options.find(o => o.isCorrect)?.text}"`);
      console.log('✓ Test 3 BESTANDEN.\n');
      passed++;
    } else {
      throw new Error('Ungültige Fragenstruktur generiert.');
    }
  } catch (err) {
    console.error('✗ Test 3 FEHLGESCHLAGEN:', err.message);
  }

  // Test 4: Menti Slides Generation (Striktes JSON)
  console.log('[Test 4/4] Generierung von Menti-Folien (Wordcloud, Choice, Scales)...');
  try {
    const prompt = `Erstelle 3 interaktive Menti-Folien zum Thema "Photosynthese" (Biologie Kl. 8).
JSON Format:
{
  "presentationTitle": "Photosynthese",
  "slides": [
    { "type": "wordcloud", "question": "Begriffe?" },
    { "type": "choice", "question": "Frage?", "options": [{"text": "A"}, {"text": "B"}] },
    { "type": "scales", "question": "Skala?", "scales": [{"statement": "These", "lowLabel": "Nein", "highLabel": "Ja"}] }
  ]
}`;
    const res = await executeCascadeRequest(prompt, true);
    const clean = res.text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(clean);
    if (parsed && Array.isArray(parsed.slides) && parsed.slides.length === 3) {
      console.log(`✓ Menti-Folien via "${res.modelUsed}" generiert: "${parsed.presentationTitle}"`);
      parsed.slides.forEach((s, idx) => console.log(`  Folie ${idx + 1} (${s.type}): "${s.question}"`));
      console.log('✓ Test 4 BESTANDEN.\n');
      passed++;
    } else {
      throw new Error('Ungültige Menti-Folienstruktur.');
    }
  } catch (err) {
    console.error('✗ Test 4 FEHLGESCHLAGEN:', err.message);
  }

  console.log('========================================');
  console.log(`  ERGEBNIS: ${passed} / ${total} TESTS BESTANDEN`);
  console.log('========================================\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();
