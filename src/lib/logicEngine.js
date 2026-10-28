function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const SETS = {
  fruits: ['🍎', '🍌', '🍇', '🍊', '🍉'],
  animals: ['🐶', '🐱', '🐰', '🦁', '🐼'],
  vehicles: ['🚗', '🚌', '🚲', '✈️', '🚂'],
  weather: ['☀️', '🌙', '⛅', '⭐'],
  food: ['🍕', '🍔', '🍟', '🌮'],
  flowers: ['🌹', '🌻', '🌸', '🌷'],
  sports: ['⚽', '🏀', '🎾', '🏈'],
  faces: ['😀', '😎', '😴', '🤖'],
};

const ODD_PUZZLES = [
  { items: ['🍎', '🍌', '🍇', '🥕', '🍊'], odd: '🥕' },
  { items: ['🚗', '🚌', '🚲', '🐶', '✈️'], odd: '🐶' },
  { items: ['☀️', '🌙', '🍕', '⭐', '⛅'], odd: '🍕' },
  { items: ['🌹', '🌷', '🐟', '🌸', '🌻'], odd: '🐟' },
  { items: ['⚽', '🏀', '🥕', '🎾', '🏈'], odd: '🥕' },
  { items: ['😀', '😎', '🏠', '😴', '🤖'], odd: '🏠' },
  { items: ['⬆️', '⬇️', '➡️', '🎈', '⬅️'], odd: '🎈' },
  { items: ['🍎', '🍌', '🍉', '🚀', '🍇'], odd: '🚀' },
  { items: ['🐶', '🐱', '🐰', '🦁', '🍕'], odd: '🍕' },
  { items: ['⚽', '🎾', '🏈', '🏀', '🌙'], odd: '🌙' },
];

function makeNext(round) {
  const period = round <= 5 ? 2 : 3;
  const set = SETS[pick(Object.keys(SETS))];
  const chosen = shuffle(set).slice(0, period);
  const shown = [];
  for (let i = 0; i < period * 2; i++) shown.push(chosen[i % period]);
  const answer = chosen[0];
  let distractors = shuffle(set.filter((e) => !chosen.includes(e)));
  if (distractors.length < 3) {
    const other = SETS[pick(Object.keys(SETS))].filter((e) => e !== answer);
    distractors = distractors.concat(shuffle(other));
  }
  distractors = distractors.slice(0, 3);
  const options = shuffle([answer, ...distractors]);
  return {
    type: 'next',
    promptKey: 'whichComesNext',
    shown,
    options,
    answerIndex: options.indexOf(answer),
  };
}

function makeCount(round) {
  const offset = round > 6 ? 1 : 0;
  const shown = [1, 2, 3].map((n) => '⚪'.repeat(n + offset));
  const nextCount = 4 + offset;
  const answer = '⚪'.repeat(nextCount);
  const distractors = [nextCount - 1, nextCount + 1, nextCount + 2].map((n) => '⚪'.repeat(n));
  const options = shuffle([answer, ...distractors]);
  return {
    type: 'count',
    promptKey: 'howManyNext',
    shown,
    options,
    answerIndex: options.indexOf(answer),
  };
}

function makeOdd() {
  const p = pick(ODD_PUZZLES);
  const others = shuffle(p.items.filter((e) => e !== p.odd)).slice(0, 3);
  const options = shuffle([p.odd, ...others]);
  return {
    type: 'odd',
    promptKey: 'findOdd',
    shown: shuffle(p.items),
    options,
    answerIndex: options.indexOf(p.odd),
  };
}

function rnd(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const WORD_TEMPLATES = {
  en: {
    area: (a, b) => `The length of a rectangle is ${a} cm and its width is ${b} cm. What is its area (cm²)?`,
    perimeter: (a, b) => `The sides of a rectangle are ${a} cm and ${b} cm. Find its perimeter (cm).`,
    speed_dist: (v, t) => `A cyclist rides at ${v} km/h for ${t} hours. How far does he travel (km)?`,
    speed_time: (d, v) => `A car travels ${d} km at ${v} km/h. How many hours does the trip take?`,
    length_km: (km) => `${km} km equals how many meters?`,
    length_cm: (m) => `${m} m equals how many centimeters?`,
    mass_kg: (kg) => `${kg} kg equals how many grams?`,
    speed_avg: (v1, v2, t) => `A bus travels ${t} hours at ${v1} km/h and ${t} hours at ${v2} km/h. What is its average speed (km/h)?`,
  },
  ru: {
    area: (a, b) => `Длина прямоугольника — ${a} см, ширина — ${b} см. Чему равна его площадь (см²)?`,
    perimeter: (a, b) => `Стороны прямоугольника — ${a} см и ${b} см. Найдите его периметр (см).`,
    speed_dist: (v, t) => `Велосипедист едет со скоростью ${v} км/ч в течение ${t} ч. Какое расстояние он проедет (км)?`,
    speed_time: (d, v) => `Автомобиль проехал ${d} км со скоростью ${v} км/ч. Сколько часов заняла поездка?`,
    length_km: (km) => `${km} км — это сколько метров?`,
    length_cm: (m) => `${m} м — это сколько сантиметров?`,
    mass_kg: (kg) => `${kg} кг — это сколько граммов?`,
    speed_avg: (v1, v2, t) => `Автобус ехал ${t} ч со скоростью ${v1} км/ч и ${t} ч со скоростью ${v2} км/ч. Какова его средняя скорость (км/ч)?`,
  },
  cs: {
    area: (a, b) => `Délka obdélníku je ${a} cm a šířka je ${b} cm. Jaká je jeho plocha (cm²)?`,
    perimeter: (a, b) => `Strany obdélníku jsou ${a} cm a ${b} cm. Jaký je jeho obvod (cm)?`,
    speed_dist: (v, t) => `Cyklista jede rychlostí ${v} km/h po dobu ${t} h. Jakou vzdálenost ujede (km)?`,
    speed_time: (d, v) => `Auto ujelo ${d} km rychlostí ${v} km/h. Kolik hodin jízda trvala?`,
    length_km: (km) => `${km} km je kolik metrů?`,
    length_cm: (m) => `${m} m je kolik centimetrů?`,
    mass_kg: (kg) => `${kg} kg je kolik gramů?`,
    speed_avg: (v1, v2, t) => `Autobus jel ${t} h rychlostí ${v1} km/h a ${t} h rychlostí ${v2} km/h. Jaká byla jeho průměrná rychlost (km/h)?`,
  },
  nl: {
    area: (a, b) => `De lengte van een rechthoek is ${a} cm en de breedte is ${b} cm. Wat is de oppervlakte (cm²)?`,
    perimeter: (a, b) => `De zijden van een rechthoek zijn ${a} cm en ${b} cm. Wat is de omtrek (cm)?`,
    speed_dist: (v, t) => `Een fietser rijdt ${t} uur lang met ${v} km/u. Welke afstand legt hij af (km)?`,
    speed_time: (d, v) => `Een auto legt ${d} km af met ${v} km/u. Hoeveel uur duurde de rit?`,
    length_km: (km) => `${km} km is hoeveel meter?`,
    length_cm: (m) => `${m} m is hoeveel centimeter?`,
    mass_kg: (kg) => `${kg} kg is hoeveel gram?`,
    speed_avg: (v1, v2, t) => `Een bus rijdt ${t} uur met ${v1} km/u en ${t} uur met ${v2} km/u. Wat is de gemiddelde snelheid (km/u)?`,
  },
};

function makeWordProblem(round, lang) {
  const T = WORD_TEMPLATES[lang] || WORD_TEMPLATES.en;
  const kinds = round <= 2
    ? ['area', 'speed_dist', 'length_km']
    : round <= 6
      ? ['area', 'perimeter', 'speed_dist', 'speed_time', 'length_km', 'mass_kg']
      : ['area', 'perimeter', 'speed_dist', 'speed_time', 'length_km', 'length_cm', 'mass_kg', 'speed_avg'];
  const kind = pick(kinds);
  let q, answer, distractors;
  if (kind === 'area') {
    const a = rnd(3, 12), b = rnd(3, 12);
    q = T.area(a, b);
    answer = a * b;
    distractors = [a + b, 2 * (a + b), a * b + a, a * b - b, (a + 1) * (b + 1)];
  } else if (kind === 'perimeter') {
    const a = rnd(4, 15), b = rnd(2, 12);
    q = T.perimeter(a, b);
    answer = 2 * (a + b);
    distractors = [a * b, a + b, 2 * a + b, 2 * b + a, 4 * (a + b)];
  } else if (kind === 'speed_dist') {
    const v = rnd(2, 12) * 5, t = rnd(2, 6);
    q = T.speed_dist(v, t);
    answer = v * t;
    distractors = [v + t, v - t, Math.round(v / t), v * t + v, v];
  } else if (kind === 'speed_time') {
    const v = rnd(4, 15) * 5, t = rnd(2, 6);
    const d = v * t;
    q = T.speed_time(d, v);
    answer = t;
    distractors = [t + 1, t - 1, Math.round(d / (v + 10)), Math.round(d / (v - 5)), t + 2];
  } else if (kind === 'length_km') {
    const km = rnd(2, 25);
    q = T.length_km(km);
    answer = km * 1000;
    distractors = [km * 100, km + 1000, km * 10, km * 1000 + 100];
  } else if (kind === 'length_cm') {
    const m = rnd(2, 20);
    q = T.length_cm(m);
    answer = m * 100;
    distractors = [m * 10, m + 100, m * 50, m * 100 + 10];
  } else if (kind === 'mass_kg') {
    const kg = rnd(2, 15);
    q = T.mass_kg(kg);
    answer = kg * 1000;
    distractors = [kg * 100, kg + 1000, kg * 10, kg * 1000 - 100];
  } else {
    const v1 = rnd(2, 12) * 2, v2 = rnd(2, 12) * 2, t = rnd(1, 3) * 2;
    q = T.speed_avg(v1, v2, t);
    answer = (v1 + v2) / 2;
    distractors = [v1 + v2, v1, v2, Math.abs(v1 - v2), (v1 + v2) / 2 + 2];
  }
  const unique = new Set([String(answer)]);
  for (const d of shuffle(distractors)) {
    if (unique.size >= 4) break;
    if (String(d) !== String(answer) && Number(d) >= 0) unique.add(String(d));
  }
  const options = shuffle([...unique]);
  return {
    type: 'word',
    prompt: q,
    shown: null,
    options,
    answerIndex: options.indexOf(String(answer)),
  };
}

const GEO_Q = {
  en: { capital: (c) => `What is the capital of ${c}?`, flag: 'Which country does this flag belong to?' },
  ru: { capital: (c) => `Какая столица у ${c}?`, flag: 'Какой стране принадлежит этот флаг?' },
  cs: { capital: (c) => `Jaké je hlavní město ${c}?`, flag: 'K jaké zemi patří tato vlajka?' },
  nl: { capital: (c) => `Wat is de hoofdstad van ${c}?`, flag: 'Bij welk land hoort deze vlag?' },
};

const GEO = [
  { flag: '🇫🇷', names: { en: 'France', ru: 'Франция', cs: 'Francie', nl: 'Frankrijk' }, capQ: { ru: 'Франции', cs: 'Francie' }, capital: { en: 'Paris', ru: 'Париж', cs: 'Paříž', nl: 'Parijs' } },
  { flag: '🇩🇪', names: { en: 'Germany', ru: 'Германия', cs: 'Německo', nl: 'Duitsland' }, capQ: { ru: 'Германии', cs: 'Německa' }, capital: { en: 'Berlin', ru: 'Берлин', cs: 'Berlín', nl: 'Berlijn' } },
  { flag: '🇮🇹', names: { en: 'Italy', ru: 'Италия', cs: 'Itálie', nl: 'Italië' }, capQ: { ru: 'Италии', cs: 'Itálie' }, capital: { en: 'Rome', ru: 'Рим', cs: 'Řím', nl: 'Rome' } },
  { flag: '🇪🇸', names: { en: 'Spain', ru: 'Испания', cs: 'Španělsko', nl: 'Spanje' }, capQ: { ru: 'Испании', cs: 'Španělska' }, capital: { en: 'Madrid', ru: 'Мадрид', cs: 'Madrid', nl: 'Madrid' } },
  { flag: '🇬🇧', names: { en: 'United Kingdom', ru: 'Великобритания', cs: 'Velká Británie', nl: 'Groot-Brittannië' }, capQ: { ru: 'Великобритании', cs: 'Velké Británie' }, capital: { en: 'London', ru: 'Лондон', cs: 'Londýn', nl: 'Londen' } },
  { flag: '🇯🇵', names: { en: 'Japan', ru: 'Япония', cs: 'Japonsko', nl: 'Japan' }, capQ: { ru: 'Японии', cs: 'Japonska' }, capital: { en: 'Tokyo', ru: 'Токио', cs: 'Tokio', nl: 'Tokio' } },
  { flag: '🇺🇸', names: { en: 'USA', ru: 'США', cs: 'USA', nl: 'VS (Verenigde Staten)' }, capQ: { ru: 'США', cs: 'USA' }, capital: { en: 'Washington', ru: 'Вашингтон', cs: 'Washington', nl: 'Washington' } },
  { flag: '🇪🇬', names: { en: 'Egypt', ru: 'Египет', cs: 'Egypt', nl: 'Egypte' }, capQ: { ru: 'Египта', cs: 'Egypta' }, capital: { en: 'Cairo', ru: 'Каир', cs: 'Káhira', nl: 'Caïro' } },
  { flag: '🇧🇷', names: { en: 'Brazil', ru: 'Бразилия', cs: 'Brazílie', nl: 'Brazilië' }, capQ: { ru: 'Бразилии', cs: 'Brazílie' }, capital: { en: 'Brasília', ru: 'Бразилиа', cs: 'Brasília', nl: 'Brasília' } },
  { flag: '🇨🇳', names: { en: 'China', ru: 'Китай', cs: 'Čína', nl: 'China' }, capQ: { ru: 'Китая', cs: 'Číny' }, capital: { en: 'Beijing', ru: 'Пекин', cs: 'Peking', nl: 'Peking' } },
  { flag: '🇷🇺', names: { en: 'Russia', ru: 'Россия', cs: 'Rusko', nl: 'Rusland' }, capQ: { ru: 'России', cs: 'Ruska' }, capital: { en: 'Moscow', ru: 'Москва', cs: 'Moskva', nl: 'Moskou' } },
  { flag: '🇹🇷', names: { en: 'Turkey', ru: 'Турция', cs: 'Turecko', nl: 'Turkije' }, capQ: { ru: 'Турции', cs: 'Turecka' }, capital: { en: 'Ankara', ru: 'Анкара', cs: 'Ankara', nl: 'Ankara' } },
  { flag: '🇵🇱', names: { en: 'Poland', ru: 'Польша', cs: 'Polsko', nl: 'Polen' }, capQ: { ru: 'Польши', cs: 'Polska' }, capital: { en: 'Warsaw', ru: 'Варшава', cs: 'Varšava', nl: 'Warschau' } },
  { flag: '🇮🇳', names: { en: 'India', ru: 'Индия', cs: 'Indie', nl: 'India' }, capQ: { ru: 'Индии', cs: 'Indie' }, capital: { en: 'New Delhi', ru: 'Нью-Дели', cs: 'Nové Dillí', nl: 'New Delhi' } },
  { flag: '🇨🇦', names: { en: 'Canada', ru: 'Канада', cs: 'Kanada', nl: 'Canada' }, capQ: { ru: 'Канады', cs: 'Kanady' }, capital: { en: 'Ottawa', ru: 'Оттава', cs: 'Ottawa', nl: 'Ottawa' } },
  { flag: '🇦🇺', names: { en: 'Australia', ru: 'Австралия', cs: 'Austrálie', nl: 'Australië' }, capQ: { ru: 'Австралии', cs: 'Austrálie' }, capital: { en: 'Canberra', ru: 'Канберра', cs: 'Canberra', nl: 'Canberra' } },
];

function makeGeo(round, lang) {
  const T = GEO_Q[lang] || GEO_Q.en;
  const entry = pick(GEO);
  const useFlag = round > 3 && Math.random() < 0.5;
  if (useFlag) {
    const others = shuffle(GEO.filter((g) => g !== entry)).slice(0, 3);
    const options = shuffle([entry.names[lang] || entry.names.en, ...others.map((g) => g.names[lang] || g.names.en)]);
    const answer = entry.names[lang] || entry.names.en;
    return { type: 'geo', prompt: T.flag, shown: entry.flag, options, answerIndex: options.indexOf(answer) };
  }
  const others = shuffle(GEO.filter((g) => g !== entry && (g.capital[lang] || g.capital.en) !== (entry.capital[lang] || entry.capital.en))).slice(0, 3);
  const options = shuffle([entry.capital[lang] || entry.capital.en, ...others.map((g) => g.capital[lang] || g.capital.en)]);
  const name = lang === 'ru' ? entry.capQ.ru : lang === 'cs' ? entry.capQ.cs : entry.names[lang] || entry.names.en;
  return { type: 'geo', prompt: T.capital(name), shown: null, options, answerIndex: options.indexOf(entry.capital[lang] || entry.capital.en) };
}

export function generateLogicPuzzle(round, lang = 'en') {
  const types = round <= 3 ? ['next', 'odd', 'word', 'geo'] : ['next', 'odd', 'count', 'word', 'word', 'geo'];
  const type = pick(types);
  if (type === 'next') return makeNext(round);
  if (type === 'count') return makeCount(round);
  if (type === 'word') return makeWordProblem(round, lang);
  if (type === 'geo') return makeGeo(round, lang);
  return makeOdd();
}

const LOGIC_KEY = 'mathpuzzle_logic_v1';

export function getLogicStats() {
  try {
    const raw = localStorage.getItem(LOGIC_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { best: 0, solved: 0 };
}

export function saveLogicStats(stats) {
  try {
    localStorage.setItem(LOGIC_KEY, JSON.stringify(stats));
  } catch {}
}