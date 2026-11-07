// What exists in the app: curricula, grades, subjects and topics (TAU-style categories).
// Topic names are translated through i18n keys `topic.<id>`.

export const GRADES = [5, 7, 9];

// A country = which grades exist there and which subjects are practised.
// English is offered everywhere so the app is not tied to one national exam.
export const CURRICULA = {
  // Czech Republic – entrance exam to gymnasium (maths + Czech) + English practice
  cz: { id: 'cz', flag: '🇨🇿', grades: [5, 7, 9], subjects: ['math', 'czech', 'english'] },
  // Germany – grade 4: move to Gymnasium (Übertritt / Probeunterricht / Eignungstest),
  // grade 10: final exams of lower secondary (MSA, ZP10 …) in maths, German, English
  de: { id: 'de', flag: '🇩🇪', grades: [4, 10], subjects: ['math', 'german', 'english'], states: true },
  // Everyone else – maths and English work in every country
  intl: { id: 'intl', flag: '🌍', grades: [5, 7, 9], subjects: ['math', 'english'] },
};

export function gradesFor(curriculum) {
  return CURRICULA[curriculum]?.grades || GRADES;
}

// a grade that exists in the chosen country (switching country keeps a sensible grade)
export function fitGrade(curriculum, grade) {
  const list = gradesFor(curriculum);
  if (list.includes(grade)) return grade;
  return list.reduce((best, g) => (Math.abs(g - grade) < Math.abs(best - grade) ? g : best), list[0]);
}

export const SUBJECTS = {
  math: { id: 'math', emoji: '📐', minutes: 70, gradient: 'from-violet-500 to-indigo-600', glow: 'shadow-violet-600/30' },
  czech: { id: 'czech', emoji: '📖', minutes: 60, gradient: 'from-rose-500 to-orange-500', glow: 'shadow-rose-600/30' },
  english: { id: 'english', emoji: '🇬🇧', minutes: 50, gradient: 'from-sky-500 to-blue-600', glow: 'shadow-sky-600/30' },
  german: { id: 'german', emoji: '📘', minutes: 60, gradient: 'from-amber-500 to-red-500', glow: 'shadow-amber-600/30' },
};

// what the info line about the German state says (exam names differ per state)
export function deInfo(stateId, grade) {
  const st = DE_STATES.find((x) => x.id === stateId);
  if (!st) return null;
  if (grade <= 5) return { key: `de.g4.${st.g4 || 'default'}`, vars: { state: st.name } };
  return { key: 'de.g10', vars: { state: st.name, exam: st.g10 || null } };
}

// a short extra label for a subject (English shows its CEFR level)
export function subjectLevel(subject, grade) {
  return subject === 'english' ? englishLevel(grade) : null;
}

// The task bank is written for grades 5/7/9 (maths) – other countries' grades map onto it.
export function contentGrade(subject, grade) {
  if (subject === 'math' || subject === 'czech') {
    if (grade <= 5) return 5;
    if (grade >= 9) return 9;
    return 7;
  }
  return grade;
}

// English level (CEFR) by grade: the same scale is used in every country.
export function englishLevel(grade) {
  if (grade <= 5) return 'A1';
  if (grade <= 7) return 'A2';
  return 'B1';
}

// German federal states: the exam names differ, so we show the state's own wording where it is clear.
export const DE_STATES = [
  { id: 'BW', name: 'Baden-Württemberg' }, { id: 'BY', name: 'Bayern', g4: 'probe' }, { id: 'BE', name: 'Berlin', g4: 'eignung', g10: 'MSA' },
  { id: 'BB', name: 'Brandenburg', g4: 'six', g10: 'MSA' }, { id: 'HB', name: 'Bremen' }, { id: 'HH', name: 'Hamburg', g10: 'MSA' },
  { id: 'HE', name: 'Hessen' }, { id: 'MV', name: 'Mecklenburg-Vorpommern' }, { id: 'NI', name: 'Niedersachsen' },
  { id: 'NW', name: 'Nordrhein-Westfalen', g10: 'ZP10' }, { id: 'RP', name: 'Rheinland-Pfalz' }, { id: 'SL', name: 'Saarland' },
  { id: 'SN', name: 'Sachsen' }, { id: 'ST', name: 'Sachsen-Anhalt' }, { id: 'SH', name: 'Schleswig-Holstein', g10: 'MSA' },
  { id: 'TH', name: 'Thüringen' },
];

// Topic areas follow the Czech curriculum (RVP ZV) for the entrance exams.
const MATH_TOPICS = {
  5: ['cislo', 'slovni', 'jednotky', 'grafy', 'rovina', 'prostor', 'konstrukce', 'aplikace', 'soumernost'],
  7: ['cislo', 'zlomky', 'jednotky', 'slovni', 'grafy', 'umernost', 'procenta', 'rovina', 'prostor', 'konstrukce', 'aplikace', 'soumernost'],
  9: ['cislo', 'zlomky', 'vyrazy', 'slovni', 'umernost', 'procenta', 'jednotky', 'grafy', 'rovina', 'prostor', 'konstrukce', 'aplikace'],
};

const CZECH_TOPICS = {
  5: ['pravopis', 'tvaroslovi', 'skladba', 'slovni_zasoba', 'porozumeni', 'sloh'],
  7: ['pravopis', 'tvaroslovi', 'skladba', 'slovni_zasoba', 'porozumeni', 'sloh', 'literatura'],
  9: ['pravopis', 'tvaroslovi', 'skladba', 'slovni_zasoba', 'porozumeni', 'sloh', 'literatura'],
};

export const TOPIC_EMOJI = {
  cislo: '🔢', slovni: '📝', jednotky: '📏', grafy: '📊', rovina: '📐', prostor: '🧊',
  konstrukce: '🧭', aplikace: '🧠', soumernost: '🪞', procenta: '💯', vyrazy: '✖️', zlomky: '➗', umernost: '🗺️',
  pravopis: '✍️', tvaroslovi: '🔤', skladba: '🧱', slovni_zasoba: '📚', porozumeni: '👓',
  sloh: '💬', literatura: '🎭',
  en_grammar: '🧩', en_tenses: '⏳', en_vocab: '📚', en_reading: '👓', en_communication: '💬',
  de_rechtschreibung: '✍️', de_grammatik: '🔤', de_zeichensetzung: '❗', de_wortschatz: '📚', de_lesen: '👓',
};

const ENGLISH_TOPICS = {
  A1: ['en_grammar', 'en_tenses', 'en_vocab', 'en_reading', 'en_communication'],
  A2: ['en_grammar', 'en_tenses', 'en_vocab', 'en_reading', 'en_communication'],
  B1: ['en_grammar', 'en_tenses', 'en_vocab', 'en_reading', 'en_communication'],
};

const GERMAN_TOPICS = {
  4: ['de_rechtschreibung', 'de_grammatik', 'de_wortschatz', 'de_lesen'],
  10: ['de_rechtschreibung', 'de_grammatik', 'de_zeichensetzung', 'de_wortschatz', 'de_lesen'],
};

export function topicsFor(subject, grade) {
  if (subject === 'english') return ENGLISH_TOPICS[englishLevel(grade)];
  if (subject === 'german') return GERMAN_TOPICS[grade >= 7 ? 10 : 4];
  const map = subject === 'czech' ? CZECH_TOPICS : MATH_TOPICS;
  const g = contentGrade(subject, grade);
  return map[g] || map[5];
}

// the topic whose tasks share one source text – put first in a full test as one block
export const READING_TOPIC = { czech: 'porozumeni', english: 'en_reading', german: 'de_lesen' };

// Mock-test blueprints: [topic, points]. Every blueprint sums to 50 points like the real exam.
export const BLUEPRINTS = {
  math: {
    5: [
      ['cislo', 2], ['cislo', 3], ['cislo', 3], ['slovni', 3], ['slovni', 4], ['slovni', 4],
      ['jednotky', 3], ['grafy', 3], ['rovina', 3], ['rovina', 4], ['prostor', 3], ['konstrukce', 3],
      ['aplikace', 3], ['aplikace', 4], ['soumernost', 3], ['jednotky', 2],
    ],
    7: [
      ['cislo', 2], ['zlomky', 3], ['zlomky', 3], ['slovni', 3], ['slovni', 4], ['procenta', 3],
      ['jednotky', 3], ['grafy', 3], ['rovina', 3], ['rovina', 4], ['prostor', 3], ['konstrukce', 3],
      ['aplikace', 4], ['soumernost', 3], ['umernost', 2], ['cislo', 2],
    ],
    9: [
      ['zlomky', 2], ['cislo', 3], ['vyrazy', 3], ['vyrazy', 3], ['vyrazy', 4], ['slovni', 4],
      ['umernost', 3], ['procenta', 3], ['jednotky', 2], ['grafy', 3], ['rovina', 3], ['rovina', 4],
      ['prostor', 3], ['konstrukce', 3], ['aplikace', 3], ['procenta', 2],
    ],
  },
  czech: {
    5: [
      ['porozumeni', 2], ['porozumeni', 2], ['porozumeni', 2], ['porozumeni', 2],
      ['pravopis', 2], ['pravopis', 2], ['pravopis', 2], ['pravopis', 2], ['pravopis', 2], ['pravopis', 2],
      ['tvaroslovi', 2], ['tvaroslovi', 2], ['tvaroslovi', 2], ['tvaroslovi', 2],
      ['skladba', 2], ['skladba', 2], ['skladba', 2], ['skladba', 2],
      ['slovni_zasoba', 2], ['slovni_zasoba', 2], ['slovni_zasoba', 2], ['slovni_zasoba', 2],
      ['sloh', 2], ['sloh', 2], ['pravopis', 2],
    ],
    7: [
      ['porozumeni', 2], ['porozumeni', 2], ['porozumeni', 2], ['porozumeni', 2],
      ['pravopis', 2], ['pravopis', 2], ['pravopis', 2], ['pravopis', 2], ['pravopis', 2],
      ['tvaroslovi', 2], ['tvaroslovi', 2], ['tvaroslovi', 2], ['tvaroslovi', 2],
      ['skladba', 2], ['skladba', 2], ['skladba', 2], ['skladba', 2],
      ['slovni_zasoba', 2], ['slovni_zasoba', 2], ['slovni_zasoba', 2],
      ['sloh', 2], ['sloh', 2], ['literatura', 2], ['literatura', 2], ['pravopis', 2],
    ],
    9: [
      ['porozumeni', 2], ['porozumeni', 2], ['porozumeni', 2], ['porozumeni', 2],
      ['pravopis', 2], ['pravopis', 2], ['pravopis', 2], ['pravopis', 2], ['pravopis', 2],
      ['tvaroslovi', 2], ['tvaroslovi', 2], ['tvaroslovi', 2], ['tvaroslovi', 2],
      ['skladba', 2], ['skladba', 2], ['skladba', 2], ['skladba', 2],
      ['slovni_zasoba', 2], ['slovni_zasoba', 2], ['slovni_zasoba', 2],
      ['sloh', 2], ['sloh', 2], ['literatura', 2], ['literatura', 2], ['pravopis', 2],
    ],
  },
};

// English: 25 tasks × 2 points; German: 25 tasks × 2 points (our own format).
const twos = (spec) => spec.flatMap(([t, n]) => Array.from({ length: n }, () => [t, 2]));
BLUEPRINTS.english = {
  A1: twos([['en_reading', 5], ['en_grammar', 6], ['en_tenses', 5], ['en_vocab', 6], ['en_communication', 3]]),
  A2: twos([['en_reading', 6], ['en_grammar', 6], ['en_tenses', 6], ['en_vocab', 4], ['en_communication', 3]]),
  B1: twos([['en_reading', 6], ['en_grammar', 6], ['en_tenses', 7], ['en_vocab', 3], ['en_communication', 3]]),
};
BLUEPRINTS.german = {
  4: twos([['de_lesen', 5], ['de_rechtschreibung', 8], ['de_grammatik', 7], ['de_wortschatz', 5]]),
  10: twos([['de_lesen', 5], ['de_rechtschreibung', 6], ['de_grammatik', 6], ['de_zeichensetzung', 4], ['de_wortschatz', 4]]),
};

// blueprint for any subject and real grade
export function blueprintFor(subject, grade) {
  if (subject === 'english') return BLUEPRINTS.english[englishLevel(grade)];
  if (subject === 'german') return BLUEPRINTS.german[grade >= 7 ? 10 : 4];
  const map = BLUEPRINTS[subject];
  return map[contentGrade(subject, grade)] || map[5];
}

// Our own practice tests: 40 full tests per subject and grade, in 4 levels of 10.
// (Own structure – not the official year/term layout.)
export const MOCK_LEVELS = 4;
export const MOCK_PER_LEVEL = 10;
export const MOCK_COUNT = MOCK_LEVELS * MOCK_PER_LEVEL;
// every topic has fixed practice variants so the child can see what is done (green)
export const TOPIC_VARIANTS = 5;


