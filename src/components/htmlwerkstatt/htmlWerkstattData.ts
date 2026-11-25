export type PhaseId = 'alle' | 'einstieg' | 'erarbeitung' | 'uebung' | 'sicherung' | 'orga';

export type GoalId = 'einstieg' | 'erarbeitung' | 'uebung' | 'sicherung' | 'orga';

export interface EditorTemplate {
  id: 'text' | 'details' | 'table' | 'box';
  label: string;
  code: string;
}

export interface PromptFormat {
  id:
    | 'geschichte'
    | 'escape'
    | 'simulation'
    | 'schritte'
    | 'zuordnen'
    | 'karten'
    | 'generator'
    | 'quiz'
    | 'check'
    | 'zufall'
    | 'timer';
  title: string;
  phase: Exclude<PhaseId, 'alle'>;
  shortDesc: string;
  promptBody: string;
  demoAnchor: string;
}

/**
 * Alle Fächer der Thüringer Rahmenstundentafel für die Regelschule (Anlage 2 zu § 44 Abs. 1 ThürSchulO)
 */
export interface RegelschuleSubject {
  value: string;
  label: string;
  exampleTopic: string;
}

export const THURINGIA_REGELSCHULE_SUBJECTS: RegelschuleSubject[] = [
  { value: 'Deutsch', label: 'Deutsch', exampleTopic: 'Kommasetzung bei Nebensätzen' },
  { value: 'Mathematik', label: 'Mathematik', exampleTopic: 'Prozent- und Zinsrechnung' },
  { value: 'Englisch', label: 'Englisch (1. Fremdsprache)', exampleTopic: 'Simple Past & Irregular Verbs' },
  { value: '2. Fremdsprache', label: '2. Fremdsprache (Französisch / Russisch / Latein)', exampleTopic: 'Sich im Alltag vorstellen' },
  { value: 'Biologie', label: 'Biologie', exampleTopic: 'Aufbau der Pflanzenzelle & Fotosynthese' },
  { value: 'Chemie', label: 'Chemie', exampleTopic: 'Säuren, Laugen und Indikatoren' },
  { value: 'Physik', label: 'Physik', exampleTopic: 'Der einfache elektrische Stromkreis' },
  { value: 'Astronomie', label: 'Astronomie', exampleTopic: 'Unser Sonnensystem und Mondphasen' },
  { value: 'Mensch-Natur-Technik (MNT)', label: 'Mensch-Natur-Technik (MNT)', exampleTopic: 'Der Wasserkreislauf in der Natur' },
  { value: 'Informatik', label: 'Informatik', exampleTopic: 'Sichere Passwörter und Verschlüsselung' },
  { value: 'Geschichte', label: 'Geschichte', exampleTopic: 'Das Alte Ägypten und der Nil' },
  { value: 'Geografie', label: 'Geografie', exampleTopic: 'Klimazonen und Naturräume Europas' },
  { value: 'Sozialkunde', label: 'Sozialkunde', exampleTopic: 'Demokratie und Gewaltenteilung' },
  { value: 'Wirtschaft und Recht', label: 'Wirtschaft und Recht', exampleTopic: 'Der Kaufvertrag im Alltag (§ 110 BGB)' },
  { value: 'WTH/S', label: 'Wirtschaft-Technik-Haushalt/Soziales (WTH/S)', exampleTopic: 'Gesunde Ernährung und Haushaltsbudget' },
  { value: 'Ethik', label: 'Ethik', exampleTopic: 'Fairness, Verantwortung und Zivilcourage' },
  { value: 'Evangelische Religionslehre', label: 'Evangelische Religionslehre', exampleTopic: 'Feste und Symbole der Weltreligionen' },
  { value: 'Katholische Religionslehre', label: 'Katholische Religionslehre', exampleTopic: 'Verantwortung für die Schöpfung' },
  { value: 'Kunst', label: 'Kunst', exampleTopic: 'Farbkontraste und Bildkomposition' },
  { value: 'Musik', label: 'Musik', exampleTopic: 'Notenwerte, Rhythmus und Instrumentenkunde' },
  { value: 'Sport', label: 'Sport', exampleTopic: 'Regelkunde und Taktik im Volleyball' },
  { value: 'Darstellen und Gestalten', label: 'Darstellen und Gestalten (Wahlpflicht)', exampleTopic: 'Körpersprache und Szenenaufbau' },
  { value: 'anderes', label: 'Anderes Fach / Projektunterricht', exampleTopic: '' },
];

export const REGELSCHULE_GRADE_GROUPS: { value: string; label: string; promptText: string }[] = [
  { value: 'Kl. 5/6', label: 'Klasse 5 und 6 (Orientierungsstufe)', promptText: 'eine 5. oder 6. Klasse der Regelschule' },
  { value: 'Kl. 7/8', label: 'Klasse 7 und 8', promptText: 'eine 7. oder 8. Klasse der Regelschule' },
  { value: 'Kl. 9/10', label: 'Klasse 9 und 10', promptText: 'eine 9. oder 10. Klasse der Regelschule' },
  { value: 'Hauptschulbildungsgang', label: 'Hauptschulbildungsgang (Kl. 7–9)', promptText: 'Schülerinnen und Schüler im Hauptschulbildungsgang (Kl. 7–9)' },
  { value: 'Realschulbildungsgang', label: 'Realschulbildungsgang (Kl. 7–10)', promptText: 'Schülerinnen und Schüler im Realschulbildungsgang (Kl. 7–10)' },
];

export const EDITOR_TEMPLATES: EditorTemplate[] = [
  {
    id: 'text',
    label: 'Überschrift und Text',
    code: `<h1>Das Alte Ägypten</h1>
<p>Jedes Jahr trat der <strong>Nil</strong> über seine Ufer und hinterließ fruchtbaren Schlamm für die Ernte.</p>
<p>Ändere diesen Text links und sieh dir rechts sofort das Ergebnis an.</p>`,
  },
  {
    id: 'details',
    label: 'Lösung zum Aufklappen',
    code: `<h2>Aufgabe 1 (Prozentrechnung)</h2>
<p>Wie viel sind 20 % von 40 €?</p>

<details>
  <summary>Lösung anzeigen</summary>
  <p>20 % von 40 € sind <b>8 €</b>, denn 40 · 20 : 100 = 8.</p>
</details>`,
  },
  {
    id: 'table',
    label: 'Tabelle',
    code: `<h2>Wortarten im Überblick</h2>
<table border="1" cellpadding="8">
  <tr><th>Wortart</th><th>Beispiel</th></tr>
  <tr><td>Nomen (Substantiv)</td><td>Schulhof, Freundschaft</td></tr>
  <tr><td>Verb</td><td>entdecken, rechnen</td></tr>
  <tr><td>Adjektiv</td><td>mutig, leise</td></tr>
</table>`,
  },
  {
    id: 'box',
    label: 'Farbiger Merkkasten',
    code: `<div style="background:#E6F4F8; border-left:6px solid #0B7BA7; padding:14px; border-radius:10px">
  <b>Merke:</b> Ein Preisschild im Schaufenster ist noch kein Kaufantrag. Den Antrag machst du erst an der Kasse.
</div>

<p style="color:#00A896; margin-top:12px"><b>Tipp:</b> Probiere eine andere Hex-Farbe aus, z. B. #F39200.</p>`,
  },
];

export const PROMPT_SUFFIX =
  'Die Seite soll eine einzelne HTML-Datei sein, die ohne Internetverbindung und ohne Installation in jedem Browser läuft, auch auf Schul-iPads und am Smartboard. Schreibe alle Texte auf Deutsch, in klarer, schülergerechter Sprache und passend für {klasse}. Gestalte die Seite übersichtlich mit großen, touchfreundlichen Knöpfen. Prüfe alle fachlichen Inhalte und Lösungen sorgfältig, bevor du antwortest, und gib mir am Ende den vollständigen Code in einem einzigen Block aus.';

export const PROMPT_FORMATS: Record<PromptFormat['id'], PromptFormat> = {
  geschichte: {
    id: 'geschichte',
    title: 'Entscheidungsgeschichte',
    phase: 'einstieg',
    shortDesc: 'Die Lernenden schlüpfen in eine Rolle und erleben die Folgen ihrer Entscheidungen.',
    demoAnchor: 'demo-geschichte',
    promptBody:
      'Erstelle mir eine interaktive Entscheidungsgeschichte für das Fach {fach} zum Thema „{thema}“. Die Lernenden schlüpfen in eine Rolle und treffen an zwei bis drei Stellen eine Entscheidung zwischen zwei Möglichkeiten. Je nach Weg landen sie bei einem von vier Ausgängen. Jeder Ausgang erklärt in zwei Sätzen, welcher Fachbegriff hinter dem Ergebnis steckt. Oben auf der Seite steht der bisherige Weg, und am Ende gibt es einen Knopf zum Neustart.',
  },
  escape: {
    id: 'escape',
    title: 'Escape-Rätsel mit Zahlenschloss',
    phase: 'einstieg',
    shortDesc: 'Drei Aufgaben ergeben einen Code, der eine Schatztruhe öffnet.',
    demoAnchor: 'demo-escape',
    promptBody:
      'Erstelle mir ein digitales Zahlenschloss für das Fach {fach} zum Thema „{thema}“. Auf der Seite stehen drei Aufgaben, deren Lösungen jeweils eine Ziffer von 0 bis 9 ergeben. Die Lernenden stellen die drei Ziffern an drei Rädern mit Pfeilknöpfen ein und klicken auf „Schloss öffnen“. Bei einem falschen Code zeigt die Seite an, wie viele Ziffern schon stimmen. Bei einem richtigen Code öffnet sich eine Truhe mit einer kurzen Glückwunschnachricht.',
  },
  simulation: {
    id: 'simulation',
    title: 'Simulation mit Schiebereglern',
    phase: 'erarbeitung',
    shortDesc: 'Die Lernenden verändern Größen mit Reglern und sehen die Wirkung sofort im Diagramm.',
    demoAnchor: 'demo-simulation',
    promptBody:
      'Erstelle mir eine interaktive Simulation für das Fach {fach} zum Thema „{thema}“. Die Lernenden verändern mit zwei bis drei Schiebereglern die wichtigsten Größen und sehen in einem Diagramm sofort, was passiert. Neben dem Diagramm stehen die wichtigsten Ergebnisse als Zahlen. Unter das Diagramm schreibst du in einem Satz, welche Vereinfachungen das Modell macht. Zeichne das Diagramm selbst mit SVG, ohne externe Bibliothek.',
  },
  schritte: {
    id: 'schritte',
    title: 'Schaubild Schritt für Schritt',
    phase: 'erarbeitung',
    shortDesc: 'Ein Schaubild baut sich Klick für Klick auf und erklärt jeden Schritt.',
    demoAnchor: 'demo-schritte',
    promptBody:
      'Erstelle mir eine Schritt-für-Schritt-Erklärung für das Fach {fach} zum Thema „{thema}“ als Schaubild. Bei jedem Klick auf „Weiter“ kommt ein neues Element ins Schaubild, und darunter erscheint ein Satz, der genau diesen Schritt erklärt. Es gibt vier bis sechs Schritte, einen Knopf „Zurück“ und eine Anzeige, bei welchem Schritt man gerade ist. Zeichne das Schaubild mit SVG.',
  },
  zuordnen: {
    id: 'zuordnen',
    title: 'Zuordnungsübung',
    phase: 'uebung',
    shortDesc: 'Begriffe werden per Ziehen oder Antippen in die richtige Kategorie sortiert.',
    demoAnchor: 'demo-zuordnen',
    promptBody:
      'Erstelle mir eine Zuordnungsübung für das Fach {fach} zum Thema „{thema}“. Es gibt drei Kategorien und neun Begriffe, die die Lernenden in die richtige Kategorie legen. Am Rechner funktioniert das per Ziehen mit der Maus, auf dem iPad tippen die Lernenden zuerst den Begriff und dann die Kategorie an. Ein Knopf „Prüfen“ färbt richtige Zuordnungen grün und falsche rot, und ein zweiter Knopf setzt alles zurück.',
  },
  karten: {
    id: 'karten',
    title: 'Lernkarten zum Umdrehen',
    phase: 'uebung',
    shortDesc: 'Karteikarten drehen sich beim Antippen um, und unsichere Karten kommen wieder dran.',
    demoAnchor: 'demo-karten',
    promptBody:
      'Erstelle mir digitale Lernkarten für das Fach {fach} zum Thema „{thema}“ mit zehn Karten. Vorne steht ein Begriff oder eine Frage, und beim Antippen dreht sich die Karte um und zeigt die Antwort. Unter der Karte gibt es die Knöpfe „Wusste ich“ und „Nochmal üben“. Karten mit „Nochmal üben“ kommen später noch einmal dran, und eine Anzeige zeigt, wie viele Karten schon sitzen.',
  },
  generator: {
    id: 'generator',
    title: 'Aufgabengenerator',
    phase: 'uebung',
    shortDesc: 'Jeder Klick erzeugt eine neue Aufgabe, und bei Fehlern erscheint der Lösungsweg.',
    demoAnchor: 'demo-generator',
    promptBody:
      'Erstelle mir einen Aufgabengenerator für das Fach {fach} zum Thema „{thema}“. Bei jedem Klick auf „Neue Aufgabe“ erzeugt die Seite eine neue Aufgabe mit zufälligen Werten. Die Lernenden tippen ihr Ergebnis ein und bekommen sofort eine Rückmeldung. Bei einer falschen Antwort zeigt die Seite den Lösungsweg. Ein Zähler hält fest, wie viele Aufgaben in Folge richtig waren.',
  },
  quiz: {
    id: 'quiz',
    title: 'Quiz mit Erklärungen',
    phase: 'sicherung',
    shortDesc: 'Nach jeder Antwort erklärt das Quiz sofort, warum sie richtig oder falsch war.',
    demoAnchor: 'demo-quiz',
    promptBody:
      'Erstelle mir ein Quiz für das Fach {fach} zum Thema „{thema}“ mit acht Fragen und jeweils drei Antwortmöglichkeiten. Nach jeder Antwort erscheint sofort eine Erklärung in zwei Sätzen, warum die Antwort richtig oder falsch ist, und danach geht es mit „Nächste Frage“ weiter. Am Ende zeigt das Quiz die Punktzahl und bietet einen Neustart an.',
  },
  check: {
    id: 'check',
    title: 'Lerncheckliste',
    phase: 'sicherung',
    shortDesc: 'Die Lernenden schätzen sich ein und bekommen zu jeder Lücke einen konkreten Tipp.',
    demoAnchor: 'demo-check',
    promptBody:
      'Erstelle mir eine Lerncheckliste für das Fach {fach} zur Vorbereitung auf eine Klassenarbeit zum Thema „{thema}“. Sie enthält sechs Aussagen nach dem Muster „Ich kann …“, und zu jeder Aussage wählen die Lernenden „Kann ich“, „Fast“ oder „Noch nicht“. Darunter erscheint eine Übersicht, was sie als Nächstes üben sollten, mit einem konkreten Tipp zu jedem Punkt. Die Auswahl soll im Browser gespeichert bleiben, damit sie beim nächsten Öffnen noch da ist.',
  },
  zufall: {
    id: 'zufall',
    title: 'Zufallsauswahl und Gruppen',
    phase: 'orga',
    shortDesc: 'Die Seite zieht Namen ohne Wiederholung und teilt die Klasse per Klick in Gruppen ein.',
    demoAnchor: 'demo-zufall',
    promptBody:
      'Erstelle mir ein Werkzeug für die Klassenorganisation im Fach {fach}. Ich trage Vornamen in ein Textfeld ein. Ein Knopf zieht einen zufälligen Namen, ohne dass jemand doppelt drankommt, bis alle einmal dran waren. Ein zweiter Knopf teilt alle Namen in Gruppen der Größe ein, die ich vorher auswähle. Die Namen dürfen die Seite nicht verlassen, also baue keinerlei Verbindung ins Internet ein.',
  },
  timer: {
    id: 'timer',
    title: 'Timer für Arbeitsphasen',
    phase: 'orga',
    shortDesc: 'Ein großer Timer zeigt am Smartboard die verbleibende Zeit und gibt am Ende einen Ton aus.',
    demoAnchor: 'demo-timer',
    promptBody:
      'Erstelle mir einen Timer für Arbeitsphasen im Fach {fach}, den ich am Smartboard zeige. Über dem Timer steht der Name der Arbeitsphase, zum Beispiel „{thema}“, und ich kann ihn selbst ändern. Der Timer hat Schnellwahlknöpfe für 3, 5, 10 und 15 Minuten, sehr große gut lesbare Ziffern, einen Fortschrittsring, einen Knopf für Vollbild und einen kurzen Ton am Ende.',
  },
};

export const PHASE_LABELS: Record<Exclude<PhaseId, 'alle'>, string> = {
  einstieg: 'Einstieg',
  erarbeitung: 'Erarbeitung',
  uebung: 'Übung',
  sicherung: 'Sicherung',
  orga: 'Organisation',
};

export const GOAL_OPTIONS: { id: GoalId; label: string }[] = [
  { id: 'einstieg', label: 'Neugier wecken' },
  { id: 'erarbeitung', label: 'Etwas Neues verstehen' },
  { id: 'uebung', label: 'Üben und festigen' },
  { id: 'sicherung', label: 'Wissen überprüfen' },
  { id: 'orga', label: 'Unterricht organisieren' },
];

export function buildPrompt(
  formatId: PromptFormat['id'],
  params: { fach: string; thema: string; klasse: string }
): string {
  const format = PROMPT_FORMATS[formatId];
  return `${format.promptBody}\n\n${PROMPT_SUFFIX}`
    .replace(/\{fach\}/g, params.fach)
    .replace(/\{thema\}/g, params.thema)
    .replace(/\{klasse\}/g, params.klasse);
}
