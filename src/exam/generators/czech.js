// Český jazyk – generátory z ověřených seznamů slov + vlastní (originální) úlohy.
// Obsah je vždy česky, protože předmětem je čeština. Formát úloh odpovídá
// jednotné přijímací zkoušce (uzavřené úlohy A–D, ANO/NE, otevřené odpovědi).

// [správně, chybně]
const IY = [
  ['býk', 'bík'], ['bydlet', 'bidlet'], ['obyvatel', 'obivatel'], ['bystrý', 'bistrý'], ['bylina', 'bilina'], ['kobyla', 'kobila'],
  ['bílý', 'býlý'], ['lyže', 'liže'], ['slyšet', 'slišet'], ['mlýn', 'mlín'], ['plyn', 'plin'], ['lýko', 'líko'], ['vzlykat', 'vzlikat'],
  ['lysý', 'lisý'], ['blýskat', 'blískat'], ['polykat', 'polikat'], ['líný', 'lýný'], ['lípa', 'lýpa'], ['límec', 'lýmec'],
  ['myslet', 'mislet'], ['mýlit se', 'mílit se'], ['hmyz', 'hmiz'], ['myš', 'miš'], ['hlemýžď', 'hlemížď'], ['zamykat', 'zamikat'],
  ['chmýří', 'chmíří'], ['mísa', 'mýsa'], ['milý', 'mylý'], ['pýcha', 'pícha'], ['pytel', 'pitel'], ['pysk', 'pisk'], ['netopýr', 'netopír'],
  ['slepýš', 'slepíš'], ['kopyto', 'kopito'], ['klopýtat', 'klopítat'], ['třpytit se', 'třpitit se'], ['pýřit se', 'pířit se'],
  ['písek', 'pýsek'], ['syn', 'sin'], ['sytý', 'sitý'], ['syrový', 'sirový'], ['sychravý', 'sichravý'], ['usychat', 'usichat'],
  ['sýkora', 'síkora'], ['sýček', 'síček'], ['sysel', 'sisel'], ['syčet', 'sičet'], ['sypat', 'sipat'], ['silnice', 'sylnice'],
  ['sirotek', 'syrotek'], ['vysoký', 'visoký'], ['zvykat', 'zvikat'], ['žvýkat', 'žvíkat'], ['vydra', 'vidra'], ['vyžle', 'vižle'],
  ['povyk', 'povik'], ['výheň', 'víheň'], ['vítr', 'výtr'], ['vidlička', 'vydlička'], ['vinice', 'vynice'], ['brzy', 'brzi'],
  ['jazyk', 'jazik'], ['nazývat', 'nazívat'], ['ozývat se', 'ozívat se'], ['zima', 'zyma'], ['zívat', 'zývat'], ['chytrý', 'chitrý'],
  ['hrdina', 'hrdyna'], ['kytara', 'kitara'], ['tygr', 'tigr'], ['ryba', 'riba'], ['čistý', 'čystý'], ['šikovný', 'šykovný'],
  ['cibule', 'cybule'], ['řídit', 'řýdit'], ['žirafa', 'žyrafa'], ['dýně', 'díně'], ['nikdy', 'nikdi'],
];

const EJE = [
  ['objevit', 'oběvit'], ['oběd', 'objed'], ['vjezd', 'vězd'], ['oběť', 'objeť'], ['objem', 'oběm'], ['objednat', 'obědnat'],
  ['oběhnout', 'objehnout'], ['dvěma', 'dvjema'], ['zapomněl', 'zapoměl'], ['vzpomněl', 'vzpoměl'], ['změna', 'zmněna'],
  ['náměstí', 'námněstí'], ['měsíc', 'mněsíc'], ['město', 'mněsto'], ['rozuměl', 'rozumněl'], ['uměl', 'umněl'],
];

const SZ = [
  ['zdola', 'sdola'], ['sešit', 'zešit'], ['zbytek', 'sbytek'], ['sklenice', 'zklenice'], ['zmrzlina', 'smrzlina'],
  ['zjistit', 'sjistit'], ['zničit', 'sničit'], ['shodit', 'zhodit'], ['svléknout', 'zvléknout'], ['zkusit', 'skusit'],
  ['zvětšit', 'světšit'], ['sjezd', 'zjezd'],
];

const CAPS = [
  ['Česká republika', 'česká republika'], ['Vltava', 'vltava'], ['Krkonoše', 'krkonoše'], ['Karlův most', 'karlův most'],
  ['Atlantský oceán', 'atlantský oceán'], ['Vánoce', 'vánoce'], ['Velikonoce', 'velikonoce'], ['Pražský hrad', 'pražský hrad'],
  ['Brňané', 'brňané'], ['Středozemní moře', 'středozemní moře'],
];

const NN = [
  ['cenný', 'cený'], ['denní', 'dení'], ['kamenný', 'kamený'], ['bezcenný', 'bezcený'], ['vlněný', 'vlnněný'], ['jarní', 'jarnní'],
  ['zimní', 'zimnní'], ['sluneční', 'slunnečí'],
];

const PRAVOPIS_POOLS = {
  5: [IY, IY, EJE, CAPS],
  7: [IY, IY, EJE, SZ, CAPS, NN],
  9: [IY, EJE, SZ, CAPS, NN],
};

function allCorrect(r, ctx) {
  const pools = PRAVOPIS_POOLS[ctx.grade] || PRAVOPIS_POOLS[5];
  const pickPair = () => r.pick(r.pick(pools));
  const used = new Set();
  const take = () => {
    let p;
    do p = pickPair(); while (used.has(p[0]));
    used.add(p[0]);
    return p;
  };
  const options = [];
  for (let i = 0; i < 4; i++) {
    const words = [take(), take(), take()];
    if (i === 0) options.push({ words: words.map((w) => w[0]), ok: true });
    else {
      const bad = r.int(0, 2);
      options.push({ words: words.map((w, j) => (j === bad ? w[1] : w[0])), ok: false, fix: `${words[bad][1]} → ${words[bad][0]}` });
    }
  }
  const sh = r.shuffle(options);
  const answer = sh.findIndex((o) => o.ok);
  return {
    type: 'choice',
    text: 'Ve které z následujících možností jsou všechna slova zapsána pravopisně správně?',
    options: sh.map((o) => o.words.join(', ')),
    answer,
    explain: sh.filter((o) => !o.ok).map((o) => o.fix).join('; '),
  };
}

function oneWrong(r, ctx) {
  // ANO/NE: is each word written correctly?
  const pools = PRAVOPIS_POOLS[ctx.grade] || PRAVOPIS_POOLS[5];
  const seen = new Set();
  const statements = [];
  const answer = [];
  while (statements.length < 4) {
    const p = r.pick(r.pick(pools));
    if (seen.has(p[0])) continue;
    seen.add(p[0]);
    const ok = r.chance(0.5);
    statements.push(`Slovo „${ok ? p[0] : p[1]}“ je zapsáno pravopisně správně.`);
    answer.push(ok);
  }
  return { type: 'tf', text: 'Rozhodněte o každém z následujících tvrzení, zda je pravdivé (ANO), či nikoli (NE).', statements, answer };
}

function fillIY(r) {
  // b_dlet → i / y (or í / ý)
  for (let k = 0; k < 40; k++) {
    const [good, bad] = r.pick(IY);
    if (good.length !== bad.length) continue;
    let pos = -1;
    for (let i = 0; i < good.length; i++) if (good[i] !== bad[i]) { pos = i; break; }
    if (pos < 0) continue;
    const pair = [good[pos], bad[pos]].sort().join('');
    if (pair !== 'iy' && pair !== 'íý') continue;
    const opts = pair === 'iy' ? ['i', 'y'] : ['í', 'ý'];
    const blank = good.slice(0, pos) + '_' + good.slice(pos + 1);
    return {
      type: 'choice', text: 'Doplňte správně i/y (í/ý):', expr: blank, options: opts,
      answer: opts.indexOf(good[pos]), explain: good,
    };
  }
  return null;
}

// shoda přísudku s podmětem: [podmět, koncovka]
const SUBJECTS = [
  ['Kluci', 'i'], ['Psi', 'i'], ['Učitelé', 'i'], ['Sousedé', 'i'], ['Chlapci', 'i'], ['Stromy', 'y'], ['Vlaky', 'y'], ['Hrady', 'y'],
  ['Ženy', 'y'], ['Dívky', 'y'], ['Kočky', 'y'], ['Děti', 'y'], ['Husy', 'y'], ['Města', 'a'], ['Kuřata', 'a'], ['Auta', 'a'],
  ['Koťata', 'a'], ['Chlapci a dívky', 'i'], ['Ženy a děti', 'y'], ['Kočky a psi', 'i'], ['Stromy a keře', 'y'], ['Vesnice a města', 'y'],
];
const VERBS = [
  ['běhal', 'po hřišti'], ['zpíval', 'písničky'], ['čekal', 'na autobus'], ['spal', 'až do rána'], ['svítil', 'v dálce'],
  ['stál', 'u cesty'], ['hrál', 'si na zahradě'], ['šustil', 'listím'], ['bručel', 'v zimě'],
];
function agreement(r) {
  let s, v, verbOk = true;
  do {
    s = r.pick(SUBJECTS);
    v = r.pick(VERBS);
    // only sensible combinations
    verbOk = !(/Města|Vesnice|Stromy|Hrady|Vlaky/.test(s[0]) && /zpíval|spal|hrál|bručel|běhal|čekal/.test(v[0]));
  } while (!verbOk);
  const opts = ['i', 'y', 'a'];
  const sent = `${s[0]} ${v[0]}_ ${v[1]}.`;
  return {
    type: 'choice', text: 'Doplňte správnou koncovku příčestí:', expr: sent, options: opts,
    answer: opts.indexOf(s[1]), explain: `${s[0]} ${v[0]}${s[1]} ${v[1]}.`,
  };
}

// slovní druhy
const POS = {
  'podstatné jméno': ['stůl', 'radost', 'kamarád', 'řeka', 'štěstí', 'běh'],
  'přídavné jméno': ['zelený', 'otcův', 'jarní', 'rychlý', 'kamenný', 'matčin'],
  'zájmeno': ['on', 'tvůj', 'někdo', 'tento', 'svůj', 'nic'],
  'číslovka': ['pět', 'třetí', 'dvakrát', 'mnoho', 'sto', 'trojí'],
  'sloveso': ['běží', 'psali', 'zpívat', 'mohu', 'přijď', 'odpočívá'],
  'příslovce': ['rychle', 'včera', 'dole', 'velmi', 'tam', 'pěšky'],
  'předložka': ['na', 'kvůli', 'pod', 'bez', 'u', 'přes'],
  'spojka': ['a', 'ale', 'protože', 'že', 'nebo', 'když'],
  'částice': ['ať', 'kéž', 'prý', 'asi', 'jen', 'ano'],
  'citoslovce': ['haf', 'au', 'bum', 'hurá', 'fuj', 'ach'],
};
function partOfSpeech(r, ctx) {
  const kinds = Object.keys(POS);
  const usable = ctx.grade <= 5 ? kinds.filter((k) => k !== 'částice') : kinds;
  const target = r.pick(usable);
  if (r.chance(0.5)) {
    const word = r.pick(POS[target]);
    const wrong = r.sample(usable.filter((k) => k !== target), 3);
    const options = r.shuffle([target, ...wrong]);
    return { type: 'choice', text: `Určete slovní druh slova „${word}“.`, options, answer: options.indexOf(target), explain: `${word} – ${target}` };
  }
  const word = r.pick(POS[target]);
  const others = r.sample(usable.filter((k) => k !== target), 3).map((k) => r.pick(POS[k]));
  const options = r.shuffle([word, ...others]);
  return { type: 'choice', text: `Které z následujících slov je ${target}?`, options, answer: options.indexOf(word), explain: `${word} – ${target}` };
}

const VZORY = {
  pán: ['student', 'kamarád', 'sedlák', 'holub', 'kocour', 'bratr'],
  hrad: ['dub', 'most', 'les', 'strom', 'vlak', 'obraz'],
  muž: ['učitel', 'lékař', 'kovář', 'řidič', 'malíř', 'přítel'],
  stroj: ['nůž', 'koš', 'klíč', 'pokoj', 'počítač', 'talíř'],
  předseda: ['hrdina', 'sluha', 'starosta', 'turista', 'cyklista'],
  soudce: ['zachránce', 'vůdce', 'průvodce', 'dárce', 'strážce'],
  žena: ['škola', 'kniha', 'voda', 'lampa', 'hora'],
  růže: ['ulice', 'lavice', 'chvíle', 'košile', 'vesnice'],
  píseň: ['báseň', 'dlaň', 'postel', 'tvář'],
  kost: ['radost', 'noc', 'věc', 'paměť', 'sůl'],
  město: ['okno', 'auto', 'jablko', 'kolo', 'slovo'],
  moře: ['pole', 'srdce', 'vejce', 'slunce', 'hřiště'],
  kuře: ['kotě', 'štěně', 'tele', 'hříbě', 'prase'],
  stavení: ['nádraží', 'náměstí', 'pobřeží', 'umění', 'listí'],
};
const ROD = {
  pán: 'mužský životný', předseda: 'mužský životný', muž: 'mužský životný', soudce: 'mužský životný',
  hrad: 'mužský neživotný', stroj: 'mužský neživotný',
  žena: 'ženský', růže: 'ženský', píseň: 'ženský', kost: 'ženský',
  město: 'střední', moře: 'střední', kuře: 'střední', stavení: 'střední',
};
function nounPattern(r) {
  const vzor = r.pick(Object.keys(VZORY));
  const word = r.pick(VZORY[vzor]);
  if (r.chance(0.5)) {
    const sameRod = Object.keys(VZORY).filter((v) => v !== vzor && ROD[v] === ROD[vzor]);
    const other = Object.keys(VZORY).filter((v) => v !== vzor && !sameRod.includes(v));
    const wrong = r.sample([...sameRod, ...r.sample(other, 3)], 3);
    const options = r.shuffle([vzor, ...wrong]);
    return { type: 'choice', text: `Podle kterého vzoru se skloňuje podstatné jméno „${word}“?`, options, answer: options.indexOf(vzor), explain: `${word} – vzor ${vzor} (rod ${ROD[vzor]})` };
  }
  const rody = ['mužský životný', 'mužský neživotný', 'ženský', 'střední'];
  return { type: 'choice', text: `Určete rod podstatného jména „${word}“.`, options: rody, answer: rody.indexOf(ROD[vzor]), explain: `${word} – vzor ${vzor}` };
}

// [tvar, osoba, číslo, čas, způsob]
const VERB_FORMS = [
  ['píšu', 1, 'jednotné', 'přítomný', 'oznamovací'], ['psali jsme', 1, 'množné', 'minulý', 'oznamovací'],
  ['budeš číst', 2, 'jednotné', 'budoucí', 'oznamovací'], ['čtěte', 2, 'množné', null, 'rozkazovací'],
  ['četl bych', 1, 'jednotné', null, 'podmiňovací'], ['nesou', 3, 'množné', 'přítomný', 'oznamovací'],
  ['přinesla', 3, 'jednotné', 'minulý', 'oznamovací'], ['zavoláme', 1, 'množné', 'budoucí', 'oznamovací'],
  ['uvidíte', 2, 'množné', 'budoucí', 'oznamovací'], ['pojď', 2, 'jednotné', null, 'rozkazovací'],
  ['šli by', 3, 'množné', null, 'podmiňovací'], ['skákal', 3, 'jednotné', 'minulý', 'oznamovací'],
  ['běžíme', 1, 'množné', 'přítomný', 'oznamovací'], ['pomohl jsi', 2, 'jednotné', 'minulý', 'oznamovací'],
];
function verbCategory(r) {
  const withTense = VERB_FORMS.filter((f) => f[3]);
  if (r.chance(0.5)) {
    const f = r.pick(withTense);
    const opts = ['přítomný', 'minulý', 'budoucí'];
    return { type: 'choice', text: `V jakém čase je sloveso „${f[0]}“?`, options: opts, answer: opts.indexOf(f[3]), explain: `${f[0]} – čas ${f[3]}` };
  }
  const mood = r.pick(['rozkazovací', 'podmiňovací']);
  const right = r.pick(VERB_FORMS.filter((f) => f[4] === mood));
  const wrong = r.sample(VERB_FORMS.filter((f) => f[4] !== mood), 3);
  const options = r.shuffle([right[0], ...wrong.map((w) => w[0])]);
  return { type: 'choice', text: `Které z následujících sloves je ve způsobu ${mood}m?`, options, answer: options.indexOf(right[0]), explain: `${right[0]} – způsob ${mood}` };
}

const ANTONYMS = [
  ['rychlý', 'pomalý'], ['den', 'noc'], ['široký', 'úzký'], ['těžký', 'lehký'], ['začátek', 'konec'], ['smutný', 'veselý'],
  ['silný', 'slabý'], ['tichý', 'hlasitý'], ['hustý', 'řídký'], ['ostrý', 'tupý'], ['líný', 'pilný'], ['koupit', 'prodat'],
  ['otevřít', 'zavřít'], ['pravda', 'lež'], ['bohatý', 'chudý'], ['dlouhý', 'krátký'], ['přítel', 'nepřítel'], ['vstup', 'výstup'],
];
const SYNONYMS = [
  ['hezký', 'pěkný'], ['kamarád', 'přítel'], ['mluvit', 'hovořit'], ['dívat se', 'hledět'], ['statečný', 'odvážný'],
  ['chytrý', 'bystrý'], ['strach', 'obava'], ['radost', 'potěšení'], ['spěchat', 'pospíchat'], ['hned', 'ihned'],
  ['smutný', 'zarmoucený'], ['brzy', 'záhy'], ['nemocný', 'chorý'], ['obrovský', 'ohromný'],
];
function synAnt(r) {
  const anto = r.chance(0.5);
  const list = anto ? ANTONYMS : SYNONYMS;
  const [a, b] = r.pick(list);
  const flip = r.chance(0.5);
  const word = flip ? b : a, right = flip ? a : b;
  const pool = [...new Set([...ANTONYMS, ...SYNONYMS].flat())].filter((w) => w !== a && w !== b && !list.some((p) => p.includes(word) && p.includes(w)));
  const options = r.shuffle([right, ...r.sample(pool, 3)]);
  return {
    type: 'choice', text: anto ? `Které slovo má opačný význam (antonymum) ke slovu „${word}“?` : `Které slovo má stejný nebo podobný význam (synonymum) jako slovo „${word}“?`,
    options, answer: options.indexOf(right), explain: `${word} – ${right}`,
  };
}

const FAMILIES = [
  ['les', ['lesník', 'lesní', 'zalesnit'], 'lesk'], ['hora', ['horský', 'horolezec', 'pahorek'], 'horký'],
  ['pes', ['psí', 'psík', 'pejsek'], 'pestrý'], ['ryba', ['rybář', 'rybník', 'rybí'], 'rybíz'],
  ['kost', ['kostra', 'kostnatý', 'kůstka'], 'kostel'], ['sůl', ['solit', 'slaný', 'solnička'], 'sólo'],
  ['mýt', ['umývat', 'mýdlo', 'umyvadlo'], 'mýtus'], ['voda', ['vodní', 'vodník', 'zavodnit'], 'podvod'],
  ['zima', ['zimní', 'zimovat', 'přezimovat'], 'zimolez'],
];
function family(r) {
  const [base, rel, odd] = r.pick(FAMILIES.filter((f) => f[0] !== 'zima'));
  const options = r.shuffle([...rel, odd]);
  return { type: 'choice', text: `Které z následujících slov NENÍ příbuzné se slovem „${base}“?`, options, answer: options.indexOf(odd), explain: `${odd} – jiný kořen` };
}

const FIGURES = [
  ['Les spí pod sněhovou peřinou.', 'personifikace'], ['Vítr si zpívá v komíně.', 'personifikace'],
  ['Oči měla jako dvě hvězdy.', 'přirovnání'], ['Byl silný jako medvěd.', 'přirovnání'],
  ['Celá škola tleskala.', 'metonymie'], ['Čtu Nerudu.', 'metonymie'],
  ['Ten člověk je liška.', 'metafora'], ['Na nebi kvetou hvězdy.', 'metafora'],
];
const GENRES = [
  ['bajka', 'krátký příběh, v němž zvířata jednají jako lidé, s ponaučením na konci'],
  ['pověst', 'vyprávění spojené se skutečným místem nebo osobou, obsahuje i smyšlené prvky'],
  ['pohádka', 'příběh s nadpřirozenými bytostmi, v němž dobro vítězí nad zlem'],
  ['balada', 'veršovaný příběh s ponurým dějem a obvykle tragickým koncem'],
  ['povídka', 'kratší prozaický útvar s jednoduchým dějem a malým počtem postav'],
  ['román', 'rozsáhlé prozaické dílo s mnoha postavami a složitým dějem'],
  ['komedie', 'divadelní hra s veselým dějem a šťastným koncem'],
  ['tragédie', 'divadelní hra, v níž hlavní hrdina zpravidla hyne'],
];
function literature(r) {
  if (r.chance(0.5)) {
    const [sent, fig] = r.pick(FIGURES);
    const all = [...new Set(FIGURES.map((f) => f[1]))];
    const options = r.shuffle([fig, ...r.sample(all.filter((x) => x !== fig), 3)]);
    return { type: 'choice', text: `Který básnický prostředek je užit ve větě: „${sent}“`, options, answer: options.indexOf(fig), explain: fig };
  }
  const [name, def] = r.pick(GENRES);
  const options = r.shuffle([name, ...r.sample(GENRES.filter((g) => g[0] !== name).map((g) => g[0]), 3)]);
  return { type: 'choice', text: `Který literární útvar odpovídá popisu: ${def}?`, options, answer: options.indexOf(name), explain: `${name} – ${def}` };
}

// ---------------------------------------------------------------- vlastní (originální) úlohy
// grades: [min, max]
const CURATED = [
  // ----- porozumění textu (originální texty)
  {
    group: 'krtek', topic: 'porozumeni', grades: [5, 7],
    context: 'Krtek obecný tráví téměř celý život pod zemí. Chodbami, které si sám vyhrabe, se pohybuje rychle dopředu i dozadu. Zrak má velmi slabý, zato dokáže citlivým čenichem a hmatovými chloupky na rypáčku rozpoznat i nepatrný pohyb v půdě. Jeho hlavní potravou jsou žížaly a larvy hmyzu. Když jich najde víc, než právě sní, ukousne žížalám přední část těla a uloží je do zásobárny. Žížaly pak nemohou utéct, ale zůstanou naživu, takže krtkovi vydrží i několik týdnů. Zahrádkáři krtky často nemají rádi kvůli hromádkám hlíny na trávníku. Krtek však zahradě i pomáhá: kypří půdu a ničí škůdce.',
    source: 'Původní text.',
    items: [
      { type: 'choice', text: 'Které z následujících tvrzení odpovídá výchozímu textu?', options: ['Krtek se v chodbách dokáže pohybovat jen dopředu.', 'Krtek vidí stejně dobře jako většina savců.', 'Krtek si dělá zásoby živých žížal.', 'Krtek se živí především kořínky rostlin.'], answer: 2, explain: 'Text uvádí, že ukousnuté žížaly zůstanou naživu a krtkovi vydrží i několik týdnů.' },
      { type: 'tf', text: 'Rozhodněte o každém z následujících tvrzení, zda odpovídá výchozímu textu (ANO), či nikoli (NE).', statements: ['Krtek rozpozná pohyb v půdě pomocí čenichu a chloupků na rypáčku.', 'Zahrádkáři mají krtky rádi, protože kypří půdu.', 'Krtek dokáže ničit škůdce.', 'Krtek žije převážně na povrchu.'], answer: [true, false, true, false] },
      { type: 'choice', text: 'Které slovo je ve výchozím textu užito jako opak slova „slabý“?', options: ['citlivým', 'rychle', 'hlavní', 'Žádné takové slovo v textu není.'], answer: 3, explain: 'V textu se slovo s opačným významem (silný) nevyskytuje.' },
    ],
  },
  {
    group: 'vylet', topic: 'porozumeni', grades: [5, 9],
    context: 'V sobotu ráno se Petra s dědou vydali na hrad Kunětická hora. Autobus jim ujel přímo před nosem, a tak šli pěšky polní cestou. „Aspoň uvidíme víc než z okna,“ usmál se děda. Cestou opravdu zahlédli srnu i dravce, který kroužil nad polem. Na hradě už stála dlouhá fronta, ale prohlídka stála za to. Průvodkyně vyprávěla o požáru, který hrad kdysi poničil, i o tom, jak se ho později podařilo opravit. Domů se vrátili až večer, unavení, ale spokojení. Petra si slíbila, že příště si nechá v mobilu nabitou baterii, aby mohla fotit.',
    source: 'Původní text.',
    items: [
      { type: 'choice', text: 'Proč Petra s dědou šli na hrad pěšky?', options: ['Chtěli vidět zvířata.', 'Nestihli autobus.', 'Autobus ten den nejezdil.', 'Děda nerad jezdí autobusem.'], answer: 1, explain: 'Autobus jim „ujel přímo před nosem“.' },
      { type: 'tf', text: 'Rozhodněte o každém z následujících tvrzení, zda odpovídá výchozímu textu (ANO), či nikoli (NE).', statements: ['Na hradě nebyla žádná fronta.', 'Průvodkyně mluvila o požáru hradu.', 'Petra během výletu hodně fotila.', 'Petra s dědou se vrátili domů až večer.'], answer: [false, true, false, true] },
      { type: 'choice', text: 'Co znamená ve výchozím textu spojení „prohlídka stála za to“?', options: ['Prohlídka byla drahá.', 'Prohlídka se vyplatila.', 'Prohlídka trvala dlouho.', 'Prohlídka se musela zastavit.'], answer: 1 },
    ],
  },
  {
    group: 'reklama', topic: 'porozumeni', grades: [7, 9],
    context: 'Mnoho lidí si myslí, že na ně reklama nepůsobí. Výzkumy však ukazují opak: i když reklamu vědomě přehlížíme, značky, které často vidíme, později považujeme za důvěryhodnější. Tento jev se nazývá efekt pouhého vystavení. Tvůrci reklam proto nesázejí jen na chytlavé slogany, ale hlavně na opakování. Obrana není snadná, pomáhá však jednoduchá otázka před každým nákupem: Kupuji si tuto věc, protože ji potřebuji, nebo protože ji znám z reklamy?',
    source: 'Původní text.',
    items: [
      { type: 'choice', text: 'Které z následujících tvrzení nejlépe vystihuje hlavní myšlenku výchozího textu?', options: ['Reklama působí jen na ty, kdo ji pozorně sledují.', 'Reklama na nás působí, i když si to neuvědomujeme.', 'Nejdůležitější součástí reklamy je slogan.', 'Proti reklamě se nelze nijak bránit.'], answer: 1 },
      { type: 'choice', text: 'Na co podle výchozího textu tvůrci reklam spoléhají nejvíce?', options: ['na humor', 'na nízkou cenu', 'na opakování', 'na známé osobnosti'], answer: 2 },
      { type: 'tf', text: 'Rozhodněte o každém z následujících tvrzení, zda odpovídá výchozímu textu (ANO), či nikoli (NE).', statements: ['Značky, které často vidíme, nám připadají důvěryhodnější.', 'Text radí reklamy úplně nesledovat.', 'Efekt pouhého vystavení funguje jen u dětí.', 'Text doporučuje zamyslet se před nákupem.'], answer: [true, false, false, true] },
    ],
  },
  {
    group: 'basen', topic: 'porozumeni', grades: [7, 9],
    context: 'Podzim přišel potichu,\nnikomu nic neřekl,\nnejdřív kaštan v kalužích\npo chodníku utekl.\n\nPak si vítr zapískal\nna listí jak na flétnu,\nzítra ráno najdu mráz\nschovaný mi v kvítku.',
    source: 'Původní text.',
    items: [
      { type: 'choice', text: 'Kolik slok má výchozí text?', options: ['jednu', 'dvě', 'čtyři', 'osm'], answer: 1 },
      { type: 'choice', text: 'Který básnický prostředek je užit ve verši „Podzim přišel potichu“?', options: ['přirovnání', 'personifikace', 'rým', 'nadsázka'], answer: 1, explain: 'Podzim jedná jako člověk – přichází a nic neříká.' },
      { type: 'choice', text: 'Ve kterém z následujících dvojverší se nachází přirovnání?', options: ['Podzim přišel potichu, / nikomu nic neřekl,', 'nejdřív kaštan v kalužích / po chodníku utekl.', 'Pak si vítr zapískal / na listí jak na flétnu,', 'zítra ráno najdu mráz / schovaný mi v kvítku.'], answer: 2, explain: 'Přirovnání „jak na flétnu“.' },
    ],
  },

  // ----- pravopis: otevřené úlohy (najděte chyby)
  { topic: 'pravopis', grades: [5, 7], type: 'text', context: 'Babička bydlí na vesnici blízko lesa. Každé ráno chodí krmit slepice a odpoledne sbírá v lese houby. Minulý týden našla obrovský hřib, který vážil skoro kilo. Celá rodina se pak sešla u babičky na smaženici.', text: 'Jsou ve výchozím textu všechna slova zapsána pravopisně správně? Pokud ano, napište „ano“. Pokud ne, napište chybně zapsané slovo pravopisně správně.', answer: ['ano'], explain: 'Text neobsahuje žádnou chybu.' },
  { topic: 'pravopis', grades: [5, 9], type: 'text', context: 'Na zahradě rostou jabloně a hrušně. Kluci si tam hrály s míčem, zatímco děda opravoval plot. Odpoledne začalo pršet, a tak se všichni schovali do chalupy.', text: 'Ve výchozím textu je jedno slovo zapsáno s pravopisnou chybou. Napište ho pravopisně správně.', answer: ['hráli'], explain: 'Kluci (rod mužský životný) → hráli.' },
  { topic: 'pravopis', grades: [7, 9], type: 'text', context: 'Na nádraží jsme dorazili brzi ráno. Vlak měl zpoždění, takže jsme si stihli koupit snídani. Sousedé, kteří jeli s námi, se smály, že takhle dlouho na vlak ještě nečekali.', text: 'Najděte ve výchozím textu dvě slova, která jsou zapsána s pravopisnou chybou, a napište je pravopisně správně. Slova oddělte čárkou v pořadí, v jakém jsou v textu.', answer: ['brzy, smáli'], explain: 'brzi → brzy; sousedé (mužský životný) → smáli.' },
  { topic: 'pravopis', grades: [7, 9], type: 'text', context: 'Ve škole jsme měli besedu s horolezcem, který vystoupil na nejvyšší hory světa. Vyprávěl nám, jak důležité je dobře se připravit a zjistit si předpověď počasí. Když se ho Martina zeptala, jestli se někdy bál, odpověděl, že strach je dobrý přítel, protože člověka chrání před zbytečnými chybamy.', text: 'Najděte ve výchozím textu slovo, které je zapsáno s pravopisnou chybou, a napište ho pravopisně správně.', answer: ['chybami'], explain: 'chyba → s chybami (vzor žena).' },

  // ----- skladba
  { topic: 'skladba', grades: [5, 9], type: 'choice', text: 'Ve které z následujících vět je podmět nevyjádřený?', options: ['Maminka uvařila polévku.', 'Včera jsme byli v kině.', 'Pes štěkal na pošťáka.', 'Na stole leží kniha.'], answer: 1, explain: 'Podmět (my) není ve větě vyjádřen.' },
  { topic: 'skladba', grades: [5, 9], type: 'choice', text: 'Které slovo je ve větě „Malý Tomáš rychle utíkal domů.“ podmětem?', options: ['Malý', 'Tomáš', 'utíkal', 'domů'], answer: 1 },
  { topic: 'skladba', grades: [5, 9], type: 'choice', text: 'Které slovo je ve větě „Na hřišti si děti hrály s novým míčem.“ přísudkem?', options: ['hřišti', 'děti', 'hrály', 'míčem'], answer: 2 },
  { topic: 'skladba', grades: [5, 7], type: 'choice', text: 'Které z následujících souvětí je zapsáno se správnou interpunkcí?', options: ['Když přijdeš domů zavolej mi.', 'Když přijdeš domů, zavolej mi.', 'Když, přijdeš domů zavolej mi.', 'Když přijdeš, domů zavolej mi.'], answer: 1 },
  { topic: 'skladba', grades: [5, 9], type: 'choice', text: 'Kolik vět obsahuje souvětí „Myslela jsem, že přijdeš, ale nakonec jsi zůstal doma.“?', options: ['dvě', 'tři', 'čtyři', 'jednu'], answer: 1, explain: 'Tři určitá slovesa: myslela jsem, přijdeš, jsi zůstal.' },
  { topic: 'skladba', grades: [7, 9], type: 'choice', text: 'Ve kterém z následujících souvětí chybí čárka?', options: ['Šli jsme do parku a pak na zmrzlinu.', 'Nevím, kdy se vrátí.', 'Přijdu hned jak to dodělám.', 'Buď půjdeme pěšky, nebo pojedeme vlakem.'], answer: 2, explain: 'Přijdu hned, jak to dodělám.' },
  { topic: 'skladba', grades: [9, 9], type: 'choice', text: 'Jaký druh vedlejší věty je v souvětí „Nevěděl, kam má jít.“?', options: ['podmětná', 'předmětná', 'přívlastková', 'příslovečná místní'], answer: 1, explain: 'Nevěděl co? → předmětná.' },
  { topic: 'skladba', grades: [9, 9], type: 'choice', text: 'Jaký druh vedlejší věty je v souvětí „Dům, který stojí na kopci, patří mému strýci.“?', options: ['přívlastková', 'předmětná', 'podmětná', 'příslovečná způsobová'], answer: 0, explain: 'Který dům? → přívlastková.' },
  { topic: 'skladba', grades: [9, 9], type: 'choice', text: 'Jaký druh vedlejší věty je v souvětí „Půjdeme ven, až přestane pršet.“?', options: ['příslovečná časová', 'příslovečná podmínková', 'předmětná', 'přívlastková'], answer: 0, explain: 'Kdy půjdeme? → časová.' },
  { topic: 'skladba', grades: [7, 9], type: 'choice', text: 'Ve které větě je přívlastek neshodný?', options: ['Zelený strom se ohýbal.', 'Dostal jsem knihu o zvířatech.', 'Otcova bunda visí na věšáku.', 'Nový sešit je na stole.'], answer: 1, explain: 'kniha o zvířatech – jaká? o zvířatech (neshodný přívlastek).' },

  // ----- sloh a komunikace
  { topic: 'sloh', grades: [5, 9], type: 'choice', text: 'Která z následujících vět je napsána spisovně?', options: ['Dneska je hrozně velkej mráz.', 'Dnes je velký mráz.', 'Dneska je fakt velkej mráz.', 'Dnes je velkej mráz.'], answer: 1 },
  { topic: 'sloh', grades: [5, 9], type: 'choice', text: 'Který pozdrav je nejvhodnější na začátek e-mailu paní ředitelce?', options: ['Ahoj,', 'Čau, paní ředitelko,', 'Vážená paní ředitelko,', 'Nazdar,'], answer: 2 },
  { topic: 'sloh', grades: [5, 9], type: 'choice', text: 'Seřaďte věty tak, aby na sebe navazovaly: (A) Nakonec ho upekla v troubě. (B) Nejdřív si připravila mouku, vajíčka a cukr. (C) Pak vše smíchala v míse. (D) Babička se rozhodla upéct koláč.', options: ['D – B – C – A', 'B – D – C – A', 'D – C – B – A', 'B – C – D – A'], answer: 0 },
  { topic: 'sloh', grades: [7, 9], type: 'choice', text: 'Ve kterém z následujících textů jde o popis?', options: ['Včera jsme jeli na výlet a cestou nám praskla pneumatika.', 'Můj pokoj je malý, ale světlý. U okna stojí psací stůl a vedle něj knihovna.', 'Nejdřív nalijte vodu do hrnce, pak přidejte sůl.', 'Myslím si, že by škola měla začínat později.'], answer: 1 },
  { topic: 'sloh', grades: [7, 9], type: 'choice', text: 'Který slohový útvar má za úkol přesvědčit čtenáře o názoru pisatele?', options: ['zpráva', 'úvaha', 'popis', 'vypravování'], answer: 1 },
  { topic: 'sloh', grades: [5, 9], type: 'choice', text: 'Co patří na konec dopisu kamarádovi?', options: ['oslovení', 'datum a místo', 'pozdrav a podpis', 'adresa příjemce'], answer: 2 },

  // ----- slovní zásoba
  { topic: 'slovni_zasoba', grades: [5, 9], type: 'choice', text: 'Co znamená rčení „mít máslo na hlavě“?', options: ['být velmi chytrý', 'mít něco provedeného a mít proto špatné svědomí', 'být velmi hladový', 'mít dobrou náladu'], answer: 1 },
  { topic: 'slovni_zasoba', grades: [5, 9], type: 'choice', text: 'Co znamená rčení „chodit kolem horké kaše“?', options: ['bát se jídla', 'nemluvit přímo k věci', 'rychle utíkat', 'vařit oběd'], answer: 1 },
  { topic: 'slovni_zasoba', grades: [5, 9], type: 'choice', text: 'Co znamená rčení „házet hrách na zeď“?', options: ['dělat něco zbytečně', 'pracovat na zahradě', 'mít velkou radost', 'zlobit se'], answer: 0 },
  { topic: 'slovni_zasoba', grades: [7, 9], type: 'choice', text: 'Které slovo je nadřazené slovům „jedle, smrk, borovice“?', options: ['les', 'jehličnan', 'strom', 'listnáč'], answer: 1, explain: 'Nejbližší nadřazený pojem je „jehličnan“.' },
  { topic: 'slovni_zasoba', grades: [7, 9], type: 'choice', text: 'Které slovo je zdrobnělinou?', options: ['domeček', 'dominance', 'domov', 'domácí'], answer: 0 },
  { topic: 'slovni_zasoba', grades: [9, 9], type: 'choice', text: 'Které slovo je přejaté z cizího jazyka?', options: ['víkend', 'chléb', 'sešit', 'pole'], answer: 0, explain: 'víkend – z angličtiny (weekend).' },

  // ----- tvarosloví
  { topic: 'tvaroslovi', grades: [5, 9], type: 'choice', text: 'Ve kterém pádě je podstatné jméno ve spojení „bez kamaráda“?', options: ['1. pád', '2. pád', '3. pád', '4. pád'], answer: 1, explain: 'bez koho, čeho → 2. pád' },
  { topic: 'tvaroslovi', grades: [5, 9], type: 'choice', text: 'Ve kterém pádě je podstatné jméno ve spojení „mluvili o prázdninách“?', options: ['3. pád', '4. pád', '6. pád', '7. pád'], answer: 2, explain: 'o kom, o čem → 6. pád' },
  { topic: 'tvaroslovi', grades: [7, 9], type: 'choice', text: 'Které přídavné jméno je přivlastňovací?', options: ['malý', 'jarní', 'Petrův', 'zelený'], answer: 2 },
  { topic: 'tvaroslovi', grades: [7, 9], type: 'choice', text: 'Které spojení obsahuje 2. stupeň přídavného jména?', options: ['nejlepší kamarád', 'lepší počasí', 'dobrý film', 'velmi dobrý výsledek'], answer: 1 },
  { topic: 'tvaroslovi', grades: [9, 9], type: 'choice', text: 'Ve které větě je sloveso v trpném rodě?', options: ['Dům postavili dělníci.', 'Dům byl postaven loni.', 'Dělníci stavějí dům.', 'Budeme stavět dům.'], answer: 1 },
];

function curatedPick(topic) {
  return (r, ctx) => {
    const pool = [];
    CURATED.filter((c) => c.topic === topic && ctx.grade >= c.grades[0] && ctx.grade <= c.grades[1]).forEach((c) => {
      if (c.items) {
        c.items.forEach((it, i) => pool.push({ ...it, context: c.context, source: c.source, group: c.group, groupIndex: i }));
      } else pool.push(c);
    });
    if (!pool.length) return null;
    const exclude = ctx.exclude || new Set();
    const fresh = pool.filter((p) => !exclude.has(p.text + (p.context || '').slice(0, 20)));
    const q = r.pick(fresh.length ? fresh : pool);
    exclude.add(q.text + (q.context || '').slice(0, 20));
    const { grades, topic: _t, ...rest } = q;
    return { ...rest, curated: true };
  };
}

// reading passages as whole groups (for mock tests: 4.1, 4.2, 4.3 …)
export function readingGroups(grade) {
  return CURATED.filter((c) => c.items && grade >= c.grades[0] && grade <= c.grades[1]);
}

export const CZECH_GENERATORS = {
  pravopis: [allCorrect, allCorrect, oneWrong, fillIY, agreement, curatedPick('pravopis')],
  tvaroslovi: [partOfSpeech, partOfSpeech, nounPattern, verbCategory, curatedPick('tvaroslovi')],
  skladba: [agreement, curatedPick('skladba'), curatedPick('skladba'), curatedPick('skladba')],
  slovni_zasoba: [synAnt, synAnt, family, curatedPick('slovni_zasoba')],
  porozumeni: [curatedPick('porozumeni')],
  sloh: [curatedPick('sloh')],
  literatura: [literature, literature, curatedPick('porozumeni')],
};

export function czechGeneratorsFor(topic) {
  return CZECH_GENERATORS[topic] || [];
}

export const CZECH_WORD_LISTS = { IY, EJE, SZ, CAPS, NN, SUBJECTS, POS, VZORY, ROD, ANTONYMS, SYNONYMS, FAMILIES };
