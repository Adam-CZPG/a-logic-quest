// What exists in the app: curricula, grades, subjects and topics (TAU-style categories).
// Topic names are translated through i18n keys `topic.<id>`.

export const GRADES = [5, 7, 9];

export const CURRICULA = {
  // Czech Republic – CERMAT jednotná přijímací zkouška: maths + Czech language
  cz: { id: 'cz', flag: '🇨🇿', subjects: ['math', 'czech'] },
  // Everyone else – maths is universal, so it works in every language
  intl: { id: 'intl', flag: '🌍', subjects: ['math'] },
};

export const SUBJECTS = {
  math: { id: 'math', emoji: '📐', minutes: 70, gradient: 'from-violet-500 to-indigo-600', glow: 'shadow-violet-600/30' },
  czech: { id: 'czech', emoji: '📖', minutes: 60, gradient: 'from-rose-500 to-orange-500', glow: 'shadow-rose-600/30' },
};

// Same category names TAU (tau.cermat.cz) uses for the 5th-grade maths test, extended for 7 and 9.
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
};

export function topicsFor(subject, grade) {
  const map = subject === 'czech' ? CZECH_TOPICS : MATH_TOPICS;
  return map[grade] || map[5];
}

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

// Our own tests: 10 series × 4 variants = 40 full tests per subject and grade
// (laid out like CERMAT's year/term grid, but clearly labelled as our own).
export const MOCK_SERIES = 10;
export const MOCK_VARIANTS_PER_SERIES = ['A', 'B', 'C', 'D'];

// Official CERMAT archive (opened in TAU – the tests themselves belong to CERMAT).
export const OFFICIAL_YEARS = [
  { year: 2024, terms: 4 }, { year: 2023, terms: 4 }, { year: 2022, terms: 4 }, { year: 2021, terms: 4 },
  { year: 2020, terms: 1 }, { year: 2019, terms: 2 }, { year: 2018, terms: 2 }, { year: 2017, terms: 2 },
  { year: 2016, terms: 1 }, { year: 2015, terms: 1 },
];

export function tauUrl(subject, grade) {
  const predmet = subject === 'czech' ? 'cj' : 'ma';
  return `https://tau.cermat.cz/vyber.php?trida=${grade}&predmet=${predmet}`;
}

export const CERMAT_ARCHIVE_URL = 'https://prijimacky.cermat.cz';
