// Slovenský jazyk – vlastné (pôvodné) úlohy pre 5. ročník (8-ročné gymnázium) a 9. ročník (Testovanie 9).
// Obsah je vždy po slovensky. ctx.realGrade: 5 alebo 9.

const g9 = (ctx) => (ctx.realGrade || ctx.grade) >= 7;
const gapText = 'Doplňte správne:';

function four(r, right, wrong, spare = []) {
  const w = [...new Set([...wrong, ...spare])].filter((x) => x && x !== right).slice(0, 3);
  const options = r.shuffle([right, ...w]);
  return { options, answer: options.indexOf(right) };
}

// ---------------------------------------------------------------- pravopis
// vybrané slová a slová s i po obojakých spoluhláskach: [správne, nesprávne]
const IY = [
  ['bydlisko', 'bidlisko'], ['obyvateľ', 'obivateľ'], ['nábytok', 'nábitok'], ['dobytok', 'dobitok'],
  ['obyčaj', 'običaj'], ['bystrý', 'bistrý'], ['bylina', 'bilina'], ['kobyla', 'kobila'], ['býk', 'bík'],
  ['myš', 'miš'], ['hmyz', 'hmiz'], ['myslieť', 'mislieť'], ['priemysel', 'priemisel'], ['mydlo', 'midlo'], ['mýliť sa', 'míliť sa'],
  ['pýcha', 'pícha'], ['pýtať sa', 'pítať sa'], ['kopyto', 'kopito'], ['prepych', 'prepich'], ['pytliak', 'pitliak'],
  ['ryba', 'riba'], ['rýchly', 'ríchly'], ['hrýzť', 'hrízť'], ['kryť', 'kriť'], ['rytier', 'ritier'], ['ryža', 'riža'], ['rýľ', 'ríľ'], ['koryto', 'korito'],
  ['syn', 'sin'], ['syr', 'sir'], ['sýty', 'síty'], ['sypať', 'sipať'], ['sýkorka', 'síkorka'], ['sychravý', 'sichravý'],
  ['vysoký', 'visoký'], ['vydra', 'vidra'], ['výr', 'vír'], ['vyžla', 'vižla'], ['zvyk', 'zvik'],
  ['jazyk', 'jazik'], ['nazývať sa', 'nazívať sa'], ['prezývka', 'prezívka'], ['ozývať sa', 'ozívať sa'],
  ['lyžica', 'ližica'], ['lyže', 'liže'], ['lysý', 'lisý'], ['plyn', 'plin'], ['plytký', 'plitký'], ['mlyn', 'mlin'], ['lýtko', 'lítko'],
  ['milý', 'mylý'], ['miska', 'myska'], ['sila', 'syla'], ['zima', 'zyma'], ['vidlička', 'vydlička'], ['pivnica', 'pyvnica'], ['silný', 'sylný'],
];
// ä a ô
const AO = [
  ['mäso', 'meso'], ['päť', 'peť'], ['deväť', 'deveť'], ['mäkký', 'mekký'], ['väčší', 'večší'], ['pamäť', 'pameť'],
  ['kôň', 'kóň'], ['stôl', 'stól'], ['môj', 'mój'], ['nôž', 'nóž'], ['vôňa', 'vóňa'], ['dôležitý', 'dóležitý'],
];
// rytmické krátenie: po dlhej slabike nasleduje krátka
const RYTM = [
  ['krásny', 'krásný'], ['múdry', 'múdrý'], ['biely', 'bielý'], ['čierny', 'čierný'], ['čítam', 'čítám'], ['chválim', 'chválím'],
  ['krátky', 'krátký'], ['píšem', 'píšém'], ['vrátiť', 'vrátíť'],
];
const POOLS = { 5: [IY, IY, IY, AO], 9: [IY, IY, AO, RYTM] };

function allCorrect(r, ctx) {
  const pools = POOLS[g9(ctx) ? 9 : 5];
  const used = new Set();
  const take = () => {
    let p;
    do p = r.pick(r.pick(pools)); while (used.has(p[0]));
    used.add(p[0]);
    return p;
  };
  const opts = [];
  for (let i = 0; i < 4; i++) {
    const ws = [take(), take(), take()];
    if (i === 0) opts.push({ t: ws.map((w) => w[0]).join(', '), ok: true });
    else {
      const bad = r.int(0, 2);
      opts.push({ t: ws.map((w, j) => (j === bad ? w[1] : w[0])).join(', '), ok: false, fix: `${ws[bad][1]} → ${ws[bad][0]}` });
    }
  }
  const sh = r.shuffle(opts);
  return {
    type: 'choice', text: 'V ktorej možnosti sú všetky slová napísané pravopisne správne?', options: sh.map((o) => o.t),
    answer: sh.findIndex((o) => o.ok), explain: sh.filter((o) => !o.ok).map((o) => o.fix).join('; '),
  };
}
function wordTF(r, ctx) {
  const pools = POOLS[g9(ctx) ? 9 : 5];
  const seen = new Set();
  const statements = [];
  const answer = [];
  while (statements.length < 4) {
    const p = r.pick(r.pick(pools));
    if (seen.has(p[0])) continue;
    seen.add(p[0]);
    const ok = r.chance(0.5);
    statements.push(`Slovo „${ok ? p[0] : p[1]}“ je napísané pravopisne správne.`);
    answer.push(ok);
  }
  return { type: 'tf', text: 'Rozhodnite o každom tvrdení, či je pravdivé (ÁNO), alebo nepravdivé (NIE).', statements, answer };
}
function fillIY(r) {
  for (let k = 0; k < 40; k++) {
    const [good, bad] = r.pick(IY);
    if (good.length !== bad.length) continue;
    let pos = -1;
    for (let i = 0; i < good.length; i++) if (good[i] !== bad[i]) { pos = i; break; }
    if (pos < 0) continue;
    const pair = [good[pos], bad[pos]].sort().join('');
    if (pair !== 'iy' && pair !== 'íý') continue;
    const opts = pair === 'iy' ? ['i', 'y'] : ['í', 'ý'];
    return {
      type: 'choice', text: 'Doplňte i/y (í/ý):', expr: good.slice(0, pos) + '_' + good.slice(pos + 1), options: opts,
      answer: opts.indexOf(good[pos]), explain: good,
    };
  }
  return null;
}
function rytmus(r) {
  const [good, bad] = r.pick(RYTM);
  const opts = r.shuffle([good, bad]);
  return {
    type: 'choice', text: 'Ktoré slovo je napísané správne podľa pravidla o rytmickom krátení?', options: opts, answer: opts.indexOf(good),
    explain: `${good} – po dlhej slabike nasleduje krátka (rytmické krátenie).`,
  };
}

// zhoda prísudku s podmetom: v minulom čase sa v jednotnom čísle mení tvar podľa rodu,
// v množnom čísle je vždy -li (chlapci, ženy aj deti sa hrali).
const SG_SUBJ = [
  ['Peter', 'm'], ['Tomáš', 'm'], ['Jakub', 'm'], ['Dedko', 'm'], ['Pán Novák', 'm'], ['Náš sused', 'm'],
  ['Petra', 'f'], ['Anna', 'f'], ['Zuzana', 'f'], ['Babka', 'f'], ['Pani učiteľka', 'f'], ['Moja sestra', 'f'],
  ['Dieťa', 'n'], ['Mačiatko', 'n'], ['Šteniatko', 'n'], ['Dievčatko', 'n'],
];
const PL_SUBJ = ['Chlapci', 'Dievčatá', 'Ženy', 'Deti', 'Psy', 'Mačky', 'Susedia', 'Kurčatá'];
// [m, f, n, mn. č., doplnenie, vhodné aj pre zvieratá]
const VERBS = [
  ['kúpil', 'kúpila', 'kúpilo', 'kúpili', 'nový zošit', 0], ['prišiel', 'prišla', 'prišlo', 'prišli', 'neskoro domov', 1],
  ['zjedol', 'zjedla', 'zjedlo', 'zjedli', 'celý rožok', 1], ['utiekol', 'utiekla', 'utieklo', 'utiekli', 'za roh', 1],
  ['zaspal', 'zaspala', 'zaspalo', 'zaspali', 'pri televízore', 1], ['našiel', 'našla', 'našlo', 'našli', 'stratený kľúč', 1],
  ['niesol', 'niesla', 'nieslo', 'niesli', 'ťažkú tašku', 0], ['vypil', 'vypila', 'vypilo', 'vypili', 'pohár mlieka', 1],
  ['išiel', 'išla', 'išlo', 'išli', 'na prechádzku', 1], ['povedal', 'povedala', 'povedalo', 'povedali', 'pravdu', 0],
];
const RI = { m: 0, f: 1, n: 2 };
const ROD = { m: 'mužský rod', f: 'ženský rod', n: 'stredný rod' };
function sgSentence(r) {
  const s = r.pick(SG_SUBJ);
  const v = r.pick(VERBS.filter((x) => s[1] !== 'n' || x[5]));
  return { s, v, right: v[RI[s[1]]] };
}
function zhoda(r, ctx) {
  if (g9(ctx) && r.chance(0.35)) {
    const subj = r.pick(PL_SUBJ);
    const v = r.pick(VERBS.filter((x) => x[5] || /Chlapci|Dievčatá|Ženy|Deti|Susedia/.test(subj)));
    const o = four(r, v[3], [v[0], v[1], v[2]]);
    return {
      type: 'choice', text: 'Ktorý tvar slovesa patrí do vety? (zhoda prísudku s podmetom)', expr: `${subj} ___ ${v[4]}.`, ...o,
      explain: `${subj} ${v[3]} ${v[4]}. V množnom čísle má sloveso v minulom čase vždy koncovku -li.`,
    };
  }
  const { s, v, right } = sgSentence(r);
  const o = four(r, right, [v[0], v[1], v[2], v[3]]);
  return {
    type: 'choice', text: 'Ktorý tvar slovesa patrí do vety? (zhoda prísudku s podmetom)', expr: `${s[0]} ___ ${v[4]}.`, ...o,
    explain: `${s[0]} ${right} ${v[4]}. Podmet „${s[0]}“ je ${ROD[s[1]]}.`,
  };
}
function zhodaTF(r) {
  const statements = [];
  const answer = [];
  const seen = new Set();
  while (statements.length < 4) {
    const { s, v, right } = sgSentence(r);
    if (seen.has(s[0])) continue;
    seen.add(s[0]);
    const ok = r.chance(0.5);
    const wrong = r.pick([v[0], v[1], v[2]].filter((x) => x !== right));
    statements.push(`Vo vete „${s[0]} ${ok ? right : wrong} ${v[4]}.“ je zhoda prísudku s podmetom správna.`);
    answer.push(ok);
  }
  return { type: 'tf', text: 'Rozhodnite o každom tvrdení, či je pravdivé (ÁNO), alebo nepravdivé (NIE).', statements, answer };
}

// ---------------------------------------------------------------- tvaroslovie
const POS = {
  'podstatné meno': ['stôl', 'radosť', 'kamarát', 'rieka', 'šťastie'],
  'prídavné meno': ['zelený', 'otcov', 'jarný', 'rýchly', 'kamenný'],
  zámeno: ['on', 'tvoj', 'niekto', 'tento', 'nič'],
  číslovka: ['päť', 'tretí', 'dvakrát', 'veľa', 'sto'],
  sloveso: ['beží', 'písali', 'spievať', 'môžem', 'príď'],
  príslovka: ['rýchlo', 'včera', 'dole', 'veľmi', 'tam'],
  predložka: ['na', 'kvôli', 'pod', 'bez', 'pri'],
  spojka: ['a', 'ale', 'pretože', 'že', 'alebo'],
  častica: ['nech', 'kiež', 'vraj', 'len', 'áno'],
  citoslovce: ['hav', 'au', 'bum', 'hurá', 'fuj'],
};
function slovnyDruh(r, ctx) {
  const kinds = Object.keys(POS).filter((k) => g9(ctx) || k !== 'častica');
  const k = r.pick(kinds);
  if (r.chance(0.5)) {
    const word = r.pick(POS[k]);
    const o = four(r, k, r.sample(kinds.filter((x) => x !== k), 3));
    return { type: 'choice', text: `Určte slovný druh slova „${word}“.`, ...o, explain: `${word} – ${k}` };
  }
  const word = r.pick(POS[k]);
  const others = r.sample(kinds.filter((x) => x !== k), 3).map((x) => r.pick(POS[x]));
  const options = r.shuffle([word, ...others]);
  return { type: 'choice', text: `Ktoré z nasledujúcich slov je ${k}?`, options, answer: options.indexOf(word), explain: `${word} – ${k}` };
}
const VZORY = {
  chlap: ['študent', 'kamarát', 'sused', 'brat', 'lekár'], hrdina: ['turista', 'cyklista', 'futbalista', 'sluha'],
  dub: ['most', 'les', 'strom', 'vlak', 'obraz'], stroj: ['nôž', 'kôš', 'kľúč', 'počítač', 'pokoj'],
  žena: ['škola', 'kniha', 'voda', 'lampa', 'hora'], ulica: ['lavica', 'chvíľa', 'košeľa', 'stanica'],
  dlaň: ['pieseň', 'báseň', 'posteľ', 'tvár'], kosť: ['radosť', 'noc', 'vec', 'pamäť', 'soľ'],
  mesto: ['okno', 'auto', 'jablko', 'koleso', 'slovo'], srdce: ['pole', 'vajce', 'more', 'plece'],
  vysvedčenie: ['námestie', 'pobrežie', 'umenie'], dievča: ['mača', 'šteňa', 'teľa', 'žriebä', 'kura'],
};
const VZOR_ROD = {
  chlap: 'mužský', hrdina: 'mužský', dub: 'mužský', stroj: 'mužský', žena: 'ženský', ulica: 'ženský', dlaň: 'ženský', kosť: 'ženský',
  mesto: 'stredný', srdce: 'stredný', vysvedčenie: 'stredný', dievča: 'stredný',
};
function vzor(r) {
  const v = r.pick(Object.keys(VZORY));
  const word = r.pick(VZORY[v]);
  if (r.chance(0.5)) {
    const same = Object.keys(VZORY).filter((x) => x !== v && VZOR_ROD[x] === VZOR_ROD[v]);
    const o = four(r, v, r.sample(same, Math.min(2, same.length)), r.sample(Object.keys(VZORY).filter((x) => x !== v), 3));
    return { type: 'choice', text: `Podľa ktorého vzoru sa skloňuje podstatné meno „${word}“?`, ...o, explain: `${word} – vzor ${v} (${VZOR_ROD[v]} rod)` };
  }
  const rody = ['mužský', 'ženský', 'stredný'];
  return { type: 'choice', text: `Určte rod podstatného mena „${word}“.`, options: rody, answer: rody.indexOf(VZOR_ROD[v]), explain: `${word} – vzor ${v}` };
}
// [spojenie, pád]
const PADY = [
  ['bez kamaráta', 'genitív'], ['o prázdninách', 'lokál'], ['s kamarátom', 'inštrumentál'], ['ku kamarátovi', 'datív'],
  ['Vidím vysoký strom.', 'akuzatív'], ['Mačka spí.', 'nominatív'], ['pri rieke', 'lokál'], ['od babky', 'genitív'],
  ['pod stolom', 'inštrumentál'], ['Pomáham mame.', 'datív'],
];
function pad(r) {
  const [phrase, p] = r.pick(PADY);
  const all = ['nominatív', 'genitív', 'datív', 'akuzatív', 'lokál', 'inštrumentál'];
  const o = four(r, p, r.sample(all.filter((x) => x !== p), 3));
  return { type: 'choice', text: `V ktorom páde je podstatné meno v spojení „${phrase}“?`, ...o, explain: `${phrase} – ${p}` };
}
// [tvar, čas, spôsob]
const SLOVESA = [
  ['píšem', 'prítomný', 'oznamovací'], ['písali sme', 'minulý', 'oznamovací'], ['budeš čítať', 'budúci', 'oznamovací'],
  ['čítajte', null, 'rozkazovací'], ['čítal by som', null, 'podmieňovací'], ['nesú', 'prítomný', 'oznamovací'],
  ['priniesla', 'minulý', 'oznamovací'], ['zavoláme', 'budúci', 'oznamovací'], ['poď', null, 'rozkazovací'], ['išli by', null, 'podmieňovací'],
];
function sloveso(r) {
  if (r.chance(0.5)) {
    const f = r.pick(SLOVESA.filter((x) => x[1]));
    const opts = ['prítomný', 'minulý', 'budúci'];
    return { type: 'choice', text: `V akom čase je sloveso „${f[0]}“?`, options: opts, answer: opts.indexOf(f[1]), explain: `${f[0]} – ${f[1]} čas` };
  }
  const mood = r.pick(['rozkazovací', 'podmieňovací']);
  const right = r.pick(SLOVESA.filter((x) => x[2] === mood));
  const o = four(r, right[0], r.sample(SLOVESA.filter((x) => x[2] !== mood), 3).map((x) => x[0]));
  return { type: 'choice', text: `Ktoré sloveso je v ${mood === 'rozkazovací' ? 'rozkazovacom' : 'podmieňovacom'} spôsobe?`, ...o, explain: `${right[0]} – ${mood} spôsob` };
}

// ---------------------------------------------------------------- skladba
const SKLADBA = [
  { grades: [5, 9], text: 'Ktoré slovo je vo vete „Malý Tomáš rýchlo utekal domov.“ podmetom?', options: ['Malý', 'Tomáš', 'utekal', 'domov'], answer: 1 },
  { grades: [5, 9], text: 'Ktoré slovo je vo vete „Na ihrisku sa deti hrali s novou loptou.“ prísudkom?', options: ['ihrisku', 'deti', 'hrali', 'loptou'], answer: 2 },
  { grades: [5, 9], text: 'V ktorej vete je podmet nevyjadrený?', options: ['Mama uvarila polievku.', 'Včera sme boli v kine.', 'Pes brechal na poštára.', 'Na stole leží kniha.'], answer: 1, explain: 'Podmet (my) nie je vo vete vyjadrený.' },
  { grades: [5, 9], text: 'Ktoré súvetie je napísané so správnou interpunkciou?', options: ['Keď prídeš domov zavolaj mi.', 'Keď prídeš domov, zavolaj mi.', 'Keď, prídeš domov zavolaj mi.', 'Keď prídeš, domov zavolaj mi.'], answer: 1 },
  { grades: [5, 9], text: 'Koľko viet obsahuje súvetie „Myslel som, že prídeš, ale nakoniec si zostal doma.“?', options: ['dve', 'tri', 'štyri', 'jednu'], answer: 1, explain: 'Tri určité slovesá: myslel som, prídeš, si zostal.' },
  { grades: [5, 9], text: 'Aký druh vety je „Prídeš zajtra na tréning?“', options: ['oznamovacia', 'opytovacia', 'rozkazovacia', 'želacia'], answer: 1 },
  { grades: [5, 9], text: 'Aký druh vety je „Kiežby už boli prázdniny!“', options: ['oznamovacia', 'opytovacia', 'rozkazovacia', 'želacia'], answer: 3 },
  { grades: [9, 9], text: 'V ktorom súvetí chýba čiarka?', options: ['Išli sme do parku a potom na zmrzlinu.', 'Neviem, kedy sa vráti.', 'Prídem hneď ako to dorobím.', 'Buď pôjdeme peši, alebo pôjdeme vlakom.'], answer: 2, explain: 'Prídem hneď, ako to dorobím.' },
  { grades: [9, 9], text: 'Aký druh vedľajšej vety je v súvetí „Nevedel, kam má ísť.“?', options: ['podmetová', 'predmetová', 'prívlastková', 'príslovková miestna'], answer: 1, explain: 'Nevedel čo? → predmetová.' },
  { grades: [9, 9], text: 'Aký druh vedľajšej vety je v súvetí „Dom, ktorý stojí na kopci, patrí môjmu strýkovi.“?', options: ['prívlastková', 'predmetová', 'podmetová', 'príslovková spôsobová'], answer: 0, explain: 'Ktorý dom? → prívlastková.' },
  { grades: [9, 9], text: 'Aký druh vedľajšej vety je v súvetí „Pôjdeme von, keď prestane pršať.“?', options: ['príslovková časová', 'príslovková podmienková', 'predmetová', 'prívlastková'], answer: 0, explain: 'Kedy pôjdeme? → časová.' },
  { grades: [9, 9], text: 'Ktorý vetný člen je podčiarknuté slovo vo vete „Dostal som knihu o [zvieratách].“?', options: ['predmet', 'nezhodný prívlastok', 'príslovkové určenie', 'prísudok'], answer: 1, explain: 'Akú knihu? – o zvieratách (nezhodný prívlastok).' },
];
function skladba(r, ctx) {
  const g = g9(ctx) ? 9 : 5;
  const pool = SKLADBA.filter((x) => g >= x.grades[0] && g <= x.grades[1]);
  const exclude = ctx.exclude || new Set();
  const fresh = pool.filter((x) => !exclude.has(x.text));
  const q = r.pick(fresh.length ? fresh : pool);
  exclude.add(q.text);
  const { grades: _g, ...rest } = q;
  return { type: 'choice', ...rest, text: rest.text.replace(/[[\]]/g, '') };
}

// ---------------------------------------------------------------- slovná zásoba
const ANTONYMÁ = [
  ['rýchly', 'pomalý'], ['deň', 'noc'], ['široký', 'úzky'], ['ťažký', 'ľahký'], ['začiatok', 'koniec'], ['smutný', 'veselý'],
  ['silný', 'slabý'], ['tichý', 'hlučný'], ['ostrý', 'tupý'], ['lenivý', 'usilovný'], ['kúpiť', 'predať'], ['otvoriť', 'zatvoriť'],
  ['pravda', 'lož'], ['bohatý', 'chudobný'], ['dlhý', 'krátky'],
];
const SYNONYMÁ = [
  ['pekný', 'krásny'], ['kamarát', 'priateľ'], ['hovoriť', 'rozprávať'], ['statočný', 'odvážny'], ['múdry', 'bystrý'],
  ['strach', 'obava'], ['radosť', 'potešenie'], ['hneď', 'ihneď'], ['chorý', 'nemocný'], ['obrovský', 'ohromný'],
];
function synAnt(r) {
  const anto = r.chance(0.5);
  const list = anto ? ANTONYMÁ : SYNONYMÁ;
  const [a, b] = r.pick(list);
  const flip = r.chance(0.5);
  const word = flip ? b : a, right = flip ? a : b;
  const pool = [...ANTONYMÁ, ...SYNONYMÁ].flat().filter((w) => w !== a && w !== b && !list.some((p) => p.includes(word) && p.includes(w)));
  const o = four(r, right, r.sample(pool, 3));
  return {
    type: 'choice', text: anto ? `Ktoré slovo má opačný význam (antonymum) k slovu „${word}“?` : `Ktoré slovo má rovnaký alebo podobný význam (synonymum) ako slovo „${word}“?`,
    ...o, explain: `${word} – ${right}`,
  };
}
const FRAZEO = [
  ['mať maslo na hlave', 'mať niečo na svedomí'], ['chodiť okolo horúcej kaše', 'nehovoriť priamo k veci'],
  ['hádzať hrach na stenu', 'robiť niečo zbytočne'], ['robiť z komára somára', 'zveličovať'],
  ['mať zlaté ruky', 'byť zručný'], ['mať vrúbok u niekoho', 'byť u niekoho v nemilosti'],
];
function frazeologizmus(r) {
  const [f, m] = r.pick(FRAZEO);
  const o = four(r, m, r.sample(FRAZEO.filter((x) => x[1] !== m).map((x) => x[1]), 3), ['byť veľmi hladný', 'mať dobrú náladu']);
  return { type: 'choice', text: `Čo znamená frazeologizmus „${f}“?`, ...o };
}
const RODINY = [
  ['les', ['lesník', 'lesný', 'zalesniť'], 'lesk'], ['hora', ['horský', 'horolezec', 'pahorok'], 'horúci'],
  ['ryba', ['rybár', 'rybník', 'rybí'], 'ríbezľa'], ['voda', ['vodný', 'vodník', 'vodopád'], 'podvod'],
  ['soľ', ['soliť', 'slaný', 'soľnička'], 'sólo'],
];
function rodina(r) {
  const [base, rel, odd] = r.pick(RODINY);
  const options = r.shuffle([...rel, odd]);
  return { type: 'choice', text: `Ktoré slovo NIE JE príbuzné so slovom „${base}“?`, options, answer: options.indexOf(odd), explain: `${odd} – iný slovotvorný základ` };
}

// ---------------------------------------------------------------- literatúra (9. ročník)
const PROSTRIEDKY = [
  ['Les spí pod snehovou perinou.', 'personifikácia'], ['Vietor si spieva v komíne.', 'personifikácia'],
  ['Oči mala ako dve hviezdy.', 'prirovnanie'], ['Bol silný ako medveď.', 'prirovnanie'],
  ['Ten človek je líška.', 'metafora'], ['Na nebi kvitnú hviezdy.', 'metafora'],
  ['zlaté slnko', 'epiteton'], ['tichá noc', 'epiteton'],
];
const ZANRE = [
  ['bájka', 'krátky príbeh, v ktorom zvieratá konajú ako ľudia, s ponaučením na konci'],
  ['povesť', 'rozprávanie spojené so skutočným miestom alebo osobou, obsahuje aj vymyslené prvky'],
  ['rozprávka', 'príbeh s nadprirodzenými bytosťami, v ktorom dobro víťazí nad zlom'],
  ['balada', 'veršovaný príbeh s pochmúrnym dejom a zvyčajne tragickým koncom'],
  ['poviedka', 'kratší prozaický útvar s jednoduchým dejom a malým počtom postáv'],
  ['román', 'rozsiahle prozaické dielo s mnohými postavami a zložitým dejom'],
];
function literatura(r) {
  if (r.chance(0.5)) {
    const [s, p] = r.pick(PROSTRIEDKY);
    const all = [...new Set(PROSTRIEDKY.map((x) => x[1]))];
    const o = four(r, p, all.filter((x) => x !== p));
    return { type: 'choice', text: `Ktorý umelecký prostriedok je použitý v ukážke: „${s}“`, ...o, explain: p };
  }
  const [name, def] = r.pick(ZANRE);
  const o = four(r, name, r.sample(ZANRE.filter((z) => z[0] !== name).map((z) => z[0]), 3));
  return { type: 'choice', text: `Ktorý literárny žáner zodpovedá opisu: ${def}?`, ...o, explain: `${name} – ${def}` };
}

// ---------------------------------------------------------------- porozumenie textu (pôvodné texty)
const READING = [
  {
    group: 'sk_jez', grades: [5],
    context: 'Jež je nočný živočích. Cez deň spí dobre ukrytý pod kríkmi alebo v hromade lístia. Až za súmraku sa vydáva hľadať potravu. Najradšej má chrobáky, dážďovky a slimáky. Keď ježa niečo vystraší, zvinie sa do pichľavej guľky. Na jeseň sa poriadne naje, pretože od novembra do marca spí zimným spánkom. Kto chce ježom pomôcť, môže v záhrade nechať kút s lístím a konármi. Mlieko im však dávať nemáme, lebo ich z neho bolí brucho.',
    source: 'Pôvodný text.',
    items: [
      { type: 'choice', text: 'Kedy jež hľadá potravu?', options: ['na poludnie', 'za súmraku', 'skoro ráno', 'iba v zime'], answer: 1 },
      { type: 'choice', text: 'Čo urobí jež, keď sa vyľaká?', options: ['Utečie.', 'Pohryzie.', 'Zvinie sa do guľky.', 'Vylezie na strom.'], answer: 2 },
      { type: 'tf', text: 'Rozhodnite, či tvrdenie zodpovedá textu (ÁNO), alebo nie (NIE).', statements: ['Jež rád žerie slimáky.', 'Jež spí zimným spánkom v lete.', 'Ježkom máme dávať mlieko.', 'Lístie v záhrade ježom pomáha.'], answer: [true, false, false, true] },
      { type: 'choice', text: 'Prečo sa jež na jeseň veľa naje?', options: ['lebo rastie', 'lebo potrebuje zásoby na zimný spánok', 'lebo na jeseň je veľa mlieka', 'lebo má mláďatá'], answer: 1 },
    ],
  },
  {
    group: 'sk_vylet', grades: [5],
    context: 'V piatok išla trieda 5.B autobusom do zoologickej záhrady. Pani učiteľka vopred povedala: „Každý si prinesie desiatu a pršiplášť.“ Našťastie, lebo krátko po príchode začalo pršať. Deti sa schovali pod strechu pri pavilóne slonov a pozerali, ako sa slony kúpu v blate. Po polhodine opäť vyšlo slnko. Najviac sa všetkým páčili tučniaky, pretože jeden stále skĺzaval do vody. Unavené, ale veselé deti sa vrátili popoludní.',
    source: 'Pôvodný text.',
    items: [
      { type: 'choice', text: 'Čím cestovala trieda do zoo?', options: ['vlakom', 'autobusom', 'bicyklom', 'pešo'], answer: 1 },
      { type: 'choice', text: 'Prečo sa hodil pršiplášť?', options: ['Bola zima.', 'Začalo pršať.', 'Slony striekali vodu.', 'Deti sa kúpali.'], answer: 1 },
      { type: 'tf', text: 'Rozhodnite, či tvrdenie zodpovedá textu (ÁNO), alebo nie (NIE).', statements: ['Výlet bol v piatok.', 'Pršalo celý deň.', 'Najviac sa deťom páčili tučniaky.', 'Deti sa vrátili večer.'], answer: [true, false, true, false] },
      { type: 'choice', text: 'Ktoré slovo najlepšie vystihuje náladu detí na konci?', options: ['smutné', 'nahnevané', 'spokojné', 'vystrašené'], answer: 2 },
    ],
  },
  {
    group: 'sk_mobil', grades: [9],
    context: 'Čoraz viac škôl diskutuje o zákaze mobilných telefónov počas vyučovania aj cez prestávky. Zástancovia tvrdia, že telefóny narúšajú sústredenie a uľahčujú kyberšikanu. Žiaci by sa navyše cez prestávky viac rozprávali a hýbali. Kritici namietajú, že zákaz nezodpovedá skutočnému životu. Mladí ľudia sa vraj musia naučiť používať digitálne médiá zodpovedne – a to sa nepodarí, ak zariadenia jednoducho zamkneme. Niektoré školy preto volia strednú cestu: na hodine zostáva mobil v taške, ak učiteľ nepovolí jeho použitie na konkrétnu úlohu.',
    source: 'Pôvodný text.',
    items: [
      { type: 'choice', text: 'Ktoré tvrdenie vystihuje názor kritikov?', options: ['Telefóny narúšajú sústredenie.', 'Mladí sa majú naučiť zodpovedne používať médiá.', 'Cez prestávky sa treba viac hýbať.', 'Telefóny treba zamknúť.'], answer: 1 },
      { type: 'choice', text: 'Čo znamená v texte „stredná cesta“?', options: ['úplný zákaz', 'žiadne pravidlá', 'mobil na hodine len s povolením učiteľa', 'zákaz iba cez prestávky'], answer: 2 },
      { type: 'tf', text: 'Rozhodnite, či tvrdenie zodpovedá textu (ÁNO), alebo nie (NIE).', statements: ['Zástancovia spájajú telefóny s kyberšikanou.', 'Všetky školy už zákaz zaviedli.', 'Kritici považujú zákaz za odtrhnutý od reality.', 'Text jednoznačne podporuje zástancov zákazu.'], answer: [true, false, true, false] },
      { type: 'choice', text: 'O aký slohový útvar ide najskôr?', options: ['rozprávanie', 'výkladový text, ktorý predstavuje rôzne názory', 'báseň', 'návod'], answer: 1 },
    ],
  },
  {
    group: 'sk_voda', grades: [9],
    context: 'Keď otvoríme vodovodný kohútik, málokedy rozmýšľame, koľko vody spotrebujeme. Na jedného človeka pripadá denne okolo sto litrov – na sprchovanie, splachovanie, pranie a varenie. Oveľa viac je však takzvanej virtuálnej vody, teda vody, ktorá sa spotrebuje pri výrobe rôznych výrobkov. Na jednu šálku kávy treba napríklad približne 130 litrov, ak započítame aj pestovanie kávových zŕn. Odborníci preto odporúčajú šetriť nielen v kúpeľni, ale aj pri nakupovaní – napríklad vyberať si miestne a sezónne potraviny.',
    source: 'Pôvodný text.',
    items: [
      { type: 'choice', text: 'Čo text označuje ako „virtuálnu vodu“?', options: ['vodu z internetu', 'vodu spotrebovanú pri výrobe výrobkov', 'dažďovú vodu', 'vodu na sprchovanie'], answer: 1 },
      { type: 'choice', text: 'Čo odporúčajú odborníci?', options: ['sprchovať sa len studenou vodou', 'prestať piť kávu', 'aj pri nakupovaní sa rozhodovať uvážlivo', 'kupovať viac vody'], answer: 2 },
      { type: 'tf', text: 'Rozhodnite, či tvrdenie zodpovedá textu (ÁNO), alebo nie (NIE).', statements: ['Človek denne spotrebuje približne sto litrov vody.', 'Virtuálnej vody je menej ako vody v domácnosti.', 'Na šálku kávy treba približne 130 litrov vody.', 'Text odporúča miestne potraviny.'], answer: [true, false, true, true] },
      { type: 'choice', text: 'Aký je hlavný cieľ textu?', options: ['pobaviť', 'informovať a podnietiť k zamysleniu', 'propagovať výrobok', 'vyrozprávať príbeh'], answer: 1 },
    ],
  },
];

export function readingGroups(grade) {
  const g = grade >= 7 ? 9 : 5;
  return READING.filter((x) => x.grades.includes(g));
}
function readingPick(r, ctx) {
  const pool = [];
  readingGroups(ctx.realGrade || ctx.grade).forEach((g) => g.items.forEach((it, i) => pool.push({ ...it, context: g.context, source: g.source, group: g.group, groupIndex: i })));
  if (!pool.length) return null;
  const exclude = ctx.exclude || new Set();
  const fresh = pool.filter((p) => !exclude.has(p.text + p.context.slice(0, 20)));
  const q = r.pick(fresh.length ? fresh : pool);
  exclude.add(q.text + q.context.slice(0, 20));
  return { ...q, curated: true };
}

const k9 = (fn) => (r, ctx) => (g9(ctx) ? fn(r, ctx) : null);

export const SLOVAK_GENERATORS = {
  sk_pravopis: [allCorrect, wordTF, fillIY, fillIY, zhoda, k9(rytmus)],
  sk_tvaroslovie: [slovnyDruh, slovnyDruh, vzor, vzor, pad, sloveso],
  sk_skladba: [zhoda, zhodaTF, skladba, skladba, skladba],
  sk_slovna_zasoba: [synAnt, synAnt, frazeologizmus, rodina],
  sk_porozumenie: [readingPick],
  sk_literatura: [literatura, literatura, readingPick],
};

export function slovakGeneratorsFor(topic) {
  return SLOVAK_GENERATORS[topic] || [];
}

export const SLOVAK_LISTS = { IY, AO, RYTM, SG_SUBJ, VERBS, VZORY, POS, READING };
