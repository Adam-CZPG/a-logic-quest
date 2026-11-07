// Deutsch – eigene (originale) Aufgaben für Klasse 4 (Übertritt) und Klasse 10 (Abschlussprüfung).
// ctx.realGrade: 4 oder 10. Inhalt immer auf Deutsch.

const g10 = (ctx) => (ctx.realGrade || ctx.grade) >= 7;
const gapText = 'Welche Lösung ist richtig? Ergänze die Lücke.';

function four(r, right, wrong, spare = []) {
  const w = [...new Set([...wrong, ...spare])].filter((x) => x && x !== right).slice(0, 3);
  const options = r.shuffle([right, ...w]);
  return { options, answer: options.indexOf(right) };
}

// ---------------------------------------------------------------- Rechtschreibung
// [richtig, falsch]
const WORDS4 = [
  ['Fahrrad', 'Farrad'], ['Lehrer', 'Lerer'], ['Fuß', 'Fus'], ['fahren', 'faren'], ['Vater', 'Fater'], ['Vogel', 'Fogel'],
  ['Tier', 'Tir'], ['Spiel', 'Spil'], ['Biene', 'Bine'], ['Kuh', 'Ku'], ['Uhr', 'Ur'], ['Mädchen', 'Mätchen'], ['Bäume', 'Beume'],
  ['Häuser', 'Heuser'], ['Hund', 'Hunt'], ['Wald', 'Walt'], ['Kind', 'Kint'], ['Zug', 'Zuk'], ['schnell', 'schnel'], ['Sonne', 'Sone'],
  ['kommen', 'komen'], ['Wasser', 'Waser'], ['Schiff', 'Schif'], ['Katze', 'Kaze'], ['Brücke', 'Brüke'], ['Zucker', 'Zuker'],
  ['Fluss', 'Flus'], ['Straße', 'Strase'], ['Blätter', 'Bletter'], ['Zahn', 'Zan'],
];
const WORDS10 = [
  ['Rhythmus', 'Rythmus'], ['Standard', 'Standart'], ['widerspiegeln', 'wiederspiegeln'], ['nämlich', 'nähmlich'], ['tödlich', 'tötlich'],
  ['Ergebnis', 'Ergebniss'], ['endgültig', 'entgültig'], ['Reparatur', 'Reperatur'], ['Interesse', 'Interresse'], ['aggressiv', 'agressiv'],
  ['Paket', 'Packet'], ['Karriere', 'Kariere'], ['Satellit', 'Sattelit'], ['Terrasse', 'Terasse'], ['Maschine', 'Maschiene'],
  ['Spaß', 'Spass'], ['Atmosphäre', 'Athmosphäre'], ['Hobbys', 'Hobbies'], ['vielleicht', 'vieleicht'],
  ['Widerstand', 'Wiederstand'], ['Gelegenheit', 'Gelegentheit'], ['Diskussion', 'Diskusion'], ['Kommission', 'Komission'],
];
function allCorrect(r, ctx) {
  const pool = g10(ctx) ? [...WORDS10, ...r.sample(WORDS4, 6)] : WORDS4;
  const used = new Set();
  const take = () => {
    let p;
    do p = r.pick(pool); while (used.has(p[0]));
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
    type: 'choice', text: 'In welcher Zeile sind alle Wörter richtig geschrieben?', options: sh.map((o) => o.t), answer: sh.findIndex((o) => o.ok),
    explain: sh.filter((o) => !o.ok).map((o) => o.fix).join('; '),
  };
}
function wordTF(r, ctx) {
  const pool = g10(ctx) ? WORDS10 : WORDS4;
  const picks = r.sample(pool, 4);
  const answer = picks.map(() => r.chance(0.5));
  return {
    type: 'tf', text: 'Ist das Wort richtig geschrieben? Entscheide bei jedem Wort (JA / NEIN).',
    statements: picks.map((p, i) => `„${answer[i] ? p[0] : p[1]}“`), answer,
  };
}
// s / ss / ß
const SSS = [
  ['Fu_ball', 'ß', 'Fußball'], ['Wa_er', 'ss', 'Wasser'], ['Stra_e', 'ß', 'Straße'], ['Schlo_', 'ss', 'Schloss'], ['gro_', 'ß', 'groß'],
  ['Ku_', 'ss', 'Kuss'], ['Gru_', 'ß', 'Gruß'], ['Flu_', 'ss', 'Fluss'], ['sü_', 'ß', 'süß'], ['Bi_', 'ss', 'Biss'], ['hei_', 'ß', 'heiß'],
  ['Fa_', 'ss', 'Fass'], ['Ha_e', 's', 'Hase'], ['Na_e', 's', 'Nase'], ['Ro_e', 's', 'Rose'], ['Schü_el', 'ss', 'Schüssel'], ['drau_en', 'ß', 'draußen'],
];
function sss(r) {
  const [blank, right, full] = r.pick(SSS);
  const opts = ['s', 'ss', 'ß'];
  return {
    type: 'choice', text: 'Was gehört in die Lücke: s, ss oder ß?', expr: blank, options: opts, answer: opts.indexOf(right),
    explain: `${full} – ${right === 'ß' ? 'nach langem Vokal oder ei/au/eu: ß' : right === 'ss' ? 'nach kurzem Vokal: ss' : 'stimmhaftes s zwischen Vokalen: s'}`,
  };
}
// Groß- und Kleinschreibung
const CAPS = [
  ['Beim [laufen] habe ich Seitenstechen bekommen.', 'Laufen', 'Nominalisierung nach „beim“ → groß.'],
  ['Wir wünschen dir alles [gute] zum Geburtstag.', 'Gute', 'Nach „alles“ wird das Adjektiv großgeschrieben.'],
  ['Am [abend] gehen wir ins Kino.', 'Abend', 'Tageszeit nach „am“ → Nomen, groß.'],
  ['Ich habe heute [morgen] verschlafen.', 'Morgen', '„heute Morgen“ – die Tageszeit wird großgeschrieben.'],
  ['Das [schwimmen] im See ist verboten.', 'Schwimmen', 'Artikel + Verb → Nomen, groß.'],
  ['Es gibt nichts [neues] zu berichten.', 'Neues', 'Nach „nichts“ → groß.'],
];
function capital(r) {
  const [sent, right, why] = r.pick(CAPS);
  const word = sent.match(/\[(.*?)\]/)[1];
  const opts = r.shuffle([right, word]);
  return { type: 'choice', text: 'Wie schreibt man das Wort in Klammern richtig?', expr: sent.replace(/\[(.*?)\]/, '___'), options: opts, answer: opts.indexOf(right), explain: why };
}
// das / dass, seit / seid, wider / wieder
const DASS = [
  ['Ich hoffe, ___ du morgen kommst.', 'dass'], ['Das Buch, ___ auf dem Tisch liegt, gehört mir.', 'das'],
  ['Er sagt, ___ er müde ist.', 'dass'], ['Siehst du das Haus, ___ dort hinten steht?', 'das'],
  ['Es ist schön, ___ ihr da seid.', 'dass'], ['___ Fahrrad meiner Schwester ist rot.', 'Das'],
  ['Ich glaube nicht, ___ das stimmt.', 'dass'], ['Das Kind, ___ dort spielt, ist mein Cousin.', 'das'],
];
const SEIT = [
  ['Ihr ___ heute sehr fleißig.', 'seid', ['seit']], ['___ gestern regnet es ununterbrochen.', 'Seit', ['Seid']],
  ['Wo ___ ihr gewesen?', 'seid', ['seit']], ['Ich warte schon ___ einer Stunde.', 'seit', ['seid']],
  ['Ich habe das Buch ___ gelesen.', 'wieder', ['wider']], ['Das ___spricht meiner Meinung.', 'wider', ['wieder']],
];
function dassDas(r, ctx) {
  if (g10(ctx) && r.chance(0.4)) {
    const [sent, right, wrong] = r.pick(SEIT);
    const opts = r.shuffle([right, ...wrong]);
    return { type: 'choice', text: gapText, expr: sent, options: opts, answer: opts.indexOf(right), explain: sent.replace('___', right) };
  }
  const [sent, right] = r.pick(DASS);
  const opts = sent.startsWith('___') ? ['Das', 'Dass'] : ['das', 'dass'];
  return {
    type: 'choice', text: gapText, expr: sent, options: opts, answer: opts.indexOf(right),
    explain: right.toLowerCase() === 'dass' ? '„dass“ ist eine Konjunktion (Nebensatz), man kann es nicht durch „dieses/welches“ ersetzen.' : '„das“ ist Artikel oder Pronomen – Probe: „dieses / welches“ passt.',
  };
}

// ---------------------------------------------------------------- Grammatik
const ARTIKEL = [
  ['Hund', 'der'], ['Katze', 'die'], ['Haus', 'das'], ['Baum', 'der'], ['Blume', 'die'], ['Auto', 'das'], ['Tisch', 'der'], ['Schule', 'die'],
  ['Buch', 'das'], ['Apfel', 'der'], ['Sonne', 'die'], ['Kind', 'das'], ['Mond', 'der'], ['Tür', 'die'], ['Fenster', 'das'], ['Löffel', 'der'],
  ['Gabel', 'die'], ['Messer', 'das'], ['Vogel', 'der'], ['Maus', 'die'], ['Pferd', 'das'], ['Stuhl', 'der'], ['Lampe', 'die'], ['Bett', 'das'],
];
function artikel(r) {
  const [w, a] = r.pick(ARTIKEL);
  const opts = ['der', 'die', 'das'];
  return { type: 'choice', text: 'Welcher Artikel passt?', expr: `___ ${w}`, options: opts, answer: opts.indexOf(a), explain: `${a} ${w}` };
}
const PLURAL = [
  ['Haus', 'Häuser', ['Hause', 'Hauses']], ['Baum', 'Bäume', ['Baume', 'Baumen']], ['Kind', 'Kinder', ['Kinde', 'Kinds']],
  ['Maus', 'Mäuse', ['Mause', 'Mausen']], ['Buch', 'Bücher', ['Buche', 'Buchs']], ['Apfel', 'Äpfel', ['Apfeln', 'Apfels']],
  ['Auto', 'Autos', ['Auten', 'Autoe']], ['Hand', 'Hände', ['Handen', 'Hands']], ['Stuhl', 'Stühle', ['Stuhle', 'Stuhlen']],
  ['Blume', 'Blumen', ['Blumes', 'Blümer']], ['Vogel', 'Vögel', ['Vogels', 'Vogeln']], ['Glas', 'Gläser', ['Glase', 'Glasen']],
];
function plural(r) {
  const [one, many, wrong] = r.pick(PLURAL);
  const o = four(r, many, [...wrong, one]);
  return { type: 'choice', text: `Wie lautet die Mehrzahl (Plural) von „${one}“?`, ...o, explain: `${one} – ${many}` };
}
const WORTARTEN = {
  Nomen: ['Freude', 'Tisch', 'Stadt', 'Mut', 'Lehrerin'], Verb: ['laufen', 'singt', 'schrieb', 'denken', 'spielt'],
  Adjektiv: ['schön', 'laut', 'grün', 'mutig', 'schnell'], Artikel: ['der', 'eine', 'das', 'ein'],
  Pronomen: ['er', 'wir', 'ihr', 'sie', 'mich'], Präposition: ['auf', 'unter', 'mit', 'neben', 'trotz'],
  Konjunktion: ['und', 'weil', 'aber', 'obwohl', 'oder'],
};
function wortart(r, ctx) {
  const kinds = g10(ctx) ? Object.keys(WORTARTEN) : ['Nomen', 'Verb', 'Adjektiv', 'Artikel'];
  const k = r.pick(kinds);
  const word = r.pick(WORTARTEN[k].filter((w) => g10(ctx) || w !== 'trotz'));
  const o = four(r, k, r.sample(kinds.filter((x) => x !== k), 3));
  return { type: 'choice', text: `Welche Wortart ist das Wort „${word}“?`, ...o, explain: `${word} – ${k}` };
}
// [Satz, Zeitform]
const ZEIT = [
  ['Ich laufe in den Park.', 'Präsens'], ['Ich lief in den Park.', 'Präteritum'], ['Ich bin in den Park gelaufen.', 'Perfekt'],
  ['Ich werde in den Park laufen.', 'Futur I'], ['Wir spielen Fußball.', 'Präsens'], ['Wir spielten Fußball.', 'Präteritum'],
  ['Wir haben Fußball gespielt.', 'Perfekt'], ['Sie wird morgen anrufen.', 'Futur I'], ['Er schrieb einen Brief.', 'Präteritum'],
  ['Ich war schon nach Hause gegangen.', 'Plusquamperfekt'], ['Sie hatte das Buch gelesen.', 'Plusquamperfekt'],
];
function zeitform(r, ctx) {
  const pool = g10(ctx) ? ZEIT : ZEIT.filter((z) => z[1] !== 'Plusquamperfekt');
  const [sent, z] = r.pick(pool);
  const forms = g10(ctx) ? ['Präsens', 'Präteritum', 'Perfekt', 'Plusquamperfekt', 'Futur I'] : ['Präsens', 'Präteritum', 'Perfekt', 'Futur I'];
  const o = four(r, z, r.sample(forms.filter((f) => f !== z), 3));
  return { type: 'choice', text: `In welcher Zeitform steht der Satz: „${sent}“`, ...o, explain: `${sent} – ${z}` };
}
// Konjugation: [Infinitiv, ich, du, er/sie/es, wir, ihr, sie]
const KONJ = [
  ['spielen', 'spiele', 'spielst', 'spielt', 'spielen', 'spielt', 'spielen'], ['lesen', 'lese', 'liest', 'liest', 'lesen', 'lest', 'lesen'],
  ['fahren', 'fahre', 'fährst', 'fährt', 'fahren', 'fahrt', 'fahren'], ['sein', 'bin', 'bist', 'ist', 'sind', 'seid', 'sind'],
  ['haben', 'habe', 'hast', 'hat', 'haben', 'habt', 'haben'], ['essen', 'esse', 'isst', 'isst', 'essen', 'esst', 'essen'],
  ['laufen', 'laufe', 'läufst', 'läuft', 'laufen', 'lauft', 'laufen'], ['schlafen', 'schlafe', 'schläfst', 'schläft', 'schlafen', 'schlaft', 'schlafen'],
];
const PERSONS = [['Ich', 1], ['Du', 2], ['Mein Bruder', 3], ['Wir', 4], ['Ihr', 5], ['Die Kinder', 6]];
const KONJ_OBJ = { spielen: 'im Garten', lesen: 'ein Buch', fahren: 'mit dem Rad', sein: 'heute sehr müde', haben: 'einen Hund', essen: 'gern Nudeln', laufen: 'schnell', schlafen: 'lange' };
function konjugation(r) {
  const v = r.pick(KONJ);
  const [subj, i] = r.pick(PERSONS);
  const right = v[i];
  const o = four(r, right, [v[1], v[2], v[3], v[5], v[0]].filter((x) => x !== right));
  return { type: 'choice', text: gapText, expr: `${subj} ___ ${KONJ_OBJ[v[0]]}. (${v[0]})`, ...o, explain: `${subj} ${right} ${KONJ_OBJ[v[0]]}.` };
}
// Satzglieder (Kl. 4) und Fälle (Kl. 10)
const SUBJ = [
  ['Der kleine Hund bellt laut.', 'Der kleine Hund', ['bellt', 'laut', 'kleine']],
  ['Am Morgen trinkt meine Oma Tee.', 'meine Oma', ['Am Morgen', 'trinkt', 'Tee']],
  ['Die Kinder spielen auf dem Hof.', 'Die Kinder', ['spielen', 'auf dem Hof', 'dem Hof']],
  ['Gestern schenkte mir Paul ein Buch.', 'Paul', ['mir', 'ein Buch', 'Gestern']],
];
const PRAED = [
  ['Der kleine Hund bellt laut.', 'bellt'], ['Im Sommer schwimmen wir oft im See.', 'schwimmen'], ['Mein Vater kocht heute Suppe.', 'kocht'],
];
// [Satz mit [Wort], Fall]
const FAELLE = [
  ['Ich gebe [dem Hund] einen Knochen.', 'Dativ'], ['Ich gebe dem Hund [einen Knochen].', 'Akkusativ'], ['[Der Lehrer] erklärt die Aufgabe.', 'Nominativ'],
  ['Das ist das Auto [meines Onkels].', 'Genitiv'], ['Wir helfen [der Nachbarin].', 'Dativ'], ['Sie besucht [ihren Freund].', 'Akkusativ'],
  ['Trotz [des Regens] gingen wir spazieren.', 'Genitiv'], ['[Mein Bruder] spielt Gitarre.', 'Nominativ'],
];
function satzglied(r, ctx) {
  if (g10(ctx)) {
    const [sent, fall] = r.pick(FAELLE);
    const word = sent.match(/\[(.*?)\]/)[1];
    const opts = ['Nominativ', 'Genitiv', 'Dativ', 'Akkusativ'];
    return { type: 'choice', text: `In welchem Fall steht „${word}“ im Satz: ${sent.replace(/[[\]]/g, '')}`, options: opts, answer: opts.indexOf(fall), explain: `${word} – ${fall}` };
  }
  if (r.chance(0.5)) {
    const [sent, right, wrong] = r.pick(SUBJ);
    const o = four(r, right, wrong);
    return { type: 'choice', text: `Was ist das Subjekt im Satz „${sent}“? (Frage: Wer oder was?)`, ...o };
  }
  const [sent, right] = r.pick(PRAED);
  const words = sent.replace('.', '').split(' ');
  const o = four(r, right, r.sample(words.filter((w) => w !== right), 3));
  return { type: 'choice', text: `Was ist das Prädikat (Verb) im Satz „${sent}“?`, ...o };
}
const STEIG = [
  ['gut', 'besser', 'am besten'], ['viel', 'mehr', 'am meisten'], ['hoch', 'höher', 'am höchsten'], ['groß', 'größer', 'am größten'],
  ['schnell', 'schneller', 'am schnellsten'], ['alt', 'älter', 'am ältesten'], ['gern', 'lieber', 'am liebsten'], ['nah', 'näher', 'am nächsten'],
];
function steigerung(r) {
  const [a, k, s] = r.pick(STEIG);
  if (r.chance(0.5)) {
    const o = four(r, k, [`${a}er`, `mehr ${a}`, s]);
    return { type: 'choice', text: `Wie heißt die erste Steigerungsform (Komparativ) von „${a}“?`, ...o, explain: `${a} – ${k} – ${s}` };
  }
  const o = four(r, s, [`am ${a}sten`, k, `am ${k}en`]);
  return { type: 'choice', text: `Wie heißt die höchste Steigerungsform (Superlativ) von „${a}“?`, ...o, explain: `${a} – ${k} – ${s}` };
}
const AKTIV_PASSIV = [
  ['Der Brief wird von Anna geschrieben.', 'Passiv'], ['Anna schreibt den Brief.', 'Aktiv'], ['Das Haus wurde 1990 gebaut.', 'Passiv'],
  ['Die Firma baute das Haus 1990.', 'Aktiv'], ['Die Fenster werden morgen geputzt.', 'Passiv'], ['Wir putzen morgen die Fenster.', 'Aktiv'],
];
const KONJUNKTIV = [
  ['Wenn ich Zeit ___, würde ich dich besuchen.', 'hätte', ['habe', 'hatte', 'haben']],
  ['Er sagte, er ___ krank.', 'sei', ['ist', 'war', 'wäre gewesen']],
  ['Wenn es nicht regnen ___, gingen wir baden.', 'würde', ['wird', 'wurde', 'werde']],
];
function g10Grammar(r) {
  if (r.chance(0.5)) {
    const [sent, form] = r.pick(AKTIV_PASSIV);
    const opts = ['Aktiv', 'Passiv'];
    return { type: 'choice', text: `Steht der Satz im Aktiv oder im Passiv? „${sent}“`, options: opts, answer: opts.indexOf(form) };
  }
  const [sent, right, wrong] = r.pick(KONJUNKTIV);
  const o = four(r, right, wrong);
  return { type: 'choice', text: gapText, expr: sent, ...o, explain: sent.replace('___', right) };
}

// ---------------------------------------------------------------- Zeichensetzung (Kl. 10)
// [richtig, falsch…, Regel]
const KOMMA = [
  ['Ich glaube, dass er recht hat.', ['Ich glaube dass, er recht hat.', 'Ich glaube dass er, recht hat.', 'Ich, glaube dass er recht hat.'], 'Komma vor „dass“ (Nebensatz).'],
  ['Weil es regnete, blieben wir zu Hause.', ['Weil es regnete blieben, wir zu Hause.', 'Weil, es regnete blieben wir zu Hause.', 'Weil es, regnete blieben wir zu Hause.'], 'Der Nebensatz wird durch ein Komma vom Hauptsatz getrennt.'],
  ['Das Fahrrad, das du gekauft hast, ist toll.', ['Das Fahrrad das du gekauft hast, ist toll.', 'Das Fahrrad, das du gekauft hast ist toll.', 'Das Fahrrad das, du gekauft hast ist toll.'], 'Ein eingeschobener Relativsatz steht zwischen zwei Kommas.'],
  ['Wir kauften Äpfel, Birnen und Bananen.', ['Wir kauften Äpfel, Birnen, und Bananen.', 'Wir kauften, Äpfel Birnen und Bananen.', 'Wir kauften Äpfel Birnen, und Bananen.'], 'Komma bei Aufzählungen – aber nicht vor „und“.'],
  ['Obwohl ich müde war, lernte ich weiter.', ['Obwohl ich müde war lernte ich weiter.', 'Obwohl, ich müde war lernte ich weiter.', 'Obwohl ich, müde war, lernte ich weiter.'], 'Komma nach dem Nebensatz mit „obwohl“.'],
  ['Er kam spät nach Hause, denn der Bus hatte Verspätung.', ['Er kam spät nach Hause denn, der Bus hatte Verspätung.', 'Er kam, spät nach Hause denn der Bus hatte Verspätung.', 'Er kam spät, nach Hause, denn der Bus hatte Verspätung.'], 'Komma vor „denn“, „aber“, „sondern“.'],
];
const REDE = [
  ['Mama rief: „Das Essen ist fertig!“', ['Mama rief „Das Essen ist fertig!“', 'Mama rief: „das Essen ist fertig!“', 'Mama rief: Das Essen ist fertig!“'], 'Redebegleitsatz vorn: Doppelpunkt, Anführungszeichen, großer Anfang.'],
  ['„Kommst du mit?“, fragte Lea.', ['„Kommst du mit?“ fragte Lea.', '„Kommst du mit“?, fragte Lea.', '„Kommst du mit?, fragte Lea.“'], 'Redebegleitsatz hinten: Komma nach dem schließenden Anführungszeichen.'],
];
function komma(r) {
  const [right, wrong, why] = r.pick(r.chance(0.75) ? KOMMA : REDE);
  const o = four(r, right, wrong);
  return { type: 'choice', text: 'Welcher Satz ist richtig geschrieben (Zeichensetzung)?', ...o, explain: why };
}
function kommaTF(r) {
  const picks = r.sample(KOMMA, 4);
  const answer = picks.map(() => r.chance(0.5));
  return {
    type: 'tf', text: 'Sind die Kommas richtig gesetzt? Entscheide bei jedem Satz (JA / NEIN).',
    statements: picks.map((p, i) => (answer[i] ? p[0] : r.pick(p[1]))), answer,
  };
}

// ---------------------------------------------------------------- Wortschatz
const GEGENTEIL = [
  ['hell', 'dunkel'], ['laut', 'leise'], ['schnell', 'langsam'], ['warm', 'kalt'], ['groß', 'klein'], ['voll', 'leer'], ['alt', 'jung'],
  ['früh', 'spät'], ['oben', 'unten'], ['kaufen', 'verkaufen'], ['fleißig', 'faul'], ['schwer', 'leicht'], ['mutig', 'ängstlich'], ['gewinnen', 'verlieren'],
];
function gegenteil(r) {
  const [a, b] = r.pick(GEGENTEIL);
  const flip = r.chance(0.5);
  const w = flip ? b : a, right = flip ? a : b;
  const o = four(r, right, r.sample(GEGENTEIL.flat().filter((x) => x !== a && x !== b), 3));
  return { type: 'choice', text: `Was ist das Gegenteil von „${w}“?`, ...o, explain: `${w} ↔ ${right}` };
}
const OBER = [
  [['Apfel', 'Birne', 'Banane'], 'Obst'], [['Hammer', 'Säge', 'Zange'], 'Werkzeug'], [['Tulpe', 'Rose', 'Nelke'], 'Blumen'],
  [['Hose', 'Jacke', 'Pullover'], 'Kleidung'], [['Bus', 'Zug', 'Straßenbahn'], 'Verkehrsmittel'], [['Geige', 'Trommel', 'Flöte'], 'Musikinstrumente'],
  [['Adler', 'Amsel', 'Meise'], 'Vögel'], [['Karotte', 'Gurke', 'Paprika'], 'Gemüse'],
];
function oberbegriff(r) {
  const [list, right] = r.pick(OBER);
  const o = four(r, right, r.sample(OBER.filter((x) => x[1] !== right).map((x) => x[1]), 3));
  return { type: 'choice', text: `Welcher Oberbegriff passt zu: ${list.join(', ')}?`, ...o };
}
const FAMILIE = [
  ['fahren', ['Fahrer', 'Fahrrad', 'Abfahrt'], 'Farbe'], ['spielen', ['Spieler', 'Spielplatz', 'verspielt'], 'Spiegel'],
  ['Schule', ['Schüler', 'schulisch', 'Schulweg'], 'Schuh'], ['lesen', ['Leser', 'lesbar', 'Lesebuch'], 'leise'],
  ['Wald', ['Waldweg', 'waldig', 'Wäldchen'], 'Walze'],
];
function wortfamilie(r) {
  const [base, rel, odd] = r.pick(FAMILIE);
  const options = r.shuffle([...rel, odd]);
  return { type: 'choice', text: `Welches Wort gehört NICHT zur Wortfamilie „${base}“?`, options, answer: options.indexOf(odd), explain: `${odd} hat einen anderen Wortstamm.` };
}
const REDEWENDUNGEN = [
  ['Tomaten auf den Augen haben', 'etwas Offensichtliches nicht bemerken'], ['jemandem einen Bären aufbinden', 'jemandem etwas Unwahres erzählen'],
  ['jemandem die Daumen drücken', 'jemandem Glück wünschen'], ['ins Fettnäpfchen treten', 'etwas Peinliches sagen oder tun'],
  ['auf dem Holzweg sein', 'sich irren'], ['den Nagel auf den Kopf treffen', 'genau das Richtige sagen'],
  ['etwas auf die lange Bank schieben', 'etwas aufschieben'], ['die Ohren steifhalten', 'durchhalten und nicht aufgeben'],
];
function redewendung(r) {
  const [phrase, meaning] = r.pick(REDEWENDUNGEN);
  const o = four(r, meaning, r.sample(REDEWENDUNGEN.filter((x) => x[1] !== meaning).map((x) => x[1]), 3));
  return { type: 'choice', text: `Was bedeutet die Redewendung „${phrase}“?`, ...o };
}
const FREMD = [
  ['Kompromiss', 'Einigung, bei der beide Seiten nachgeben'], ['Argument', 'Begründung für eine Meinung'], ['Initiative', 'eigener Entschluss, etwas zu tun'],
  ['Konsequenz', 'Folge einer Handlung'], ['Prognose', 'Vorhersage'], ['objektiv', 'sachlich, unparteiisch'], ['ambivalent', 'zwiespältig'],
];
function fremdwort(r) {
  const [w, m] = r.pick(FREMD);
  const o = four(r, m, r.sample(FREMD.filter((x) => x[0] !== w).map((x) => x[1]), 3));
  return { type: 'choice', text: `Was bedeutet das Wort „${w}“?`, ...o };
}

// ---------------------------------------------------------------- Leseverstehen (eigene Texte)
const READING = [
  {
    group: 'de_igel', grades: [4],
    context: 'Igel sind nachtaktive Tiere. Tagsüber schlafen sie gut versteckt unter Hecken oder in Laubhaufen. Erst in der Dämmerung gehen sie auf Futtersuche. Sie fressen vor allem Käfer, Würmer und Schnecken. Wenn ein Igel Angst hat, rollt er sich zu einer stacheligen Kugel zusammen. Im Herbst frisst er sich ein dickes Fettpolster an, denn von November bis März hält er Winterschlaf. Wer Igeln helfen möchte, lässt im Garten eine Ecke mit Laub und Ästen liegen. Milch sollte man Igeln nicht geben, sie bekommen davon Bauchweh.',
    source: 'Eigener Text.',
    items: [
      { type: 'choice', text: 'Wann suchen Igel ihr Futter?', options: ['am Mittag', 'in der Dämmerung', 'am frühen Morgen', 'nur im Winter'], answer: 1 },
      { type: 'choice', text: 'Was macht ein Igel, wenn er Angst hat?', options: ['Er läuft weg.', 'Er beißt.', 'Er rollt sich zusammen.', 'Er klettert auf einen Baum.'], answer: 2 },
      { type: 'tf', text: 'Stimmt die Aussage mit dem Text überein? Entscheide (JA / NEIN).', statements: ['Igel fressen gern Schnecken.', 'Igel halten im Sommer Winterschlaf.', 'Man sollte Igeln Milch geben.', 'Laub im Garten hilft den Igeln.'], answer: [true, false, false, true] },
      { type: 'choice', text: 'Warum frisst der Igel im Herbst besonders viel?', options: ['weil er wächst', 'weil er ein Fettpolster für den Winterschlaf braucht', 'weil es im Herbst viel Milch gibt', 'weil er Junge bekommt'], answer: 1 },
    ],
  },
  {
    group: 'de_ausflug', grades: [4],
    context: 'Am Freitag fuhr die Klasse 4b mit dem Bus in den Tierpark. Frau Berger hatte vorher gesagt: „Jeder bringt ein Pausenbrot und eine Regenjacke mit.“ Zum Glück, denn kurz nach der Ankunft fing es an zu regnen. Die Kinder stellten sich unter das Dach beim Elefantenhaus und schauten zu, wie die Elefanten im Schlamm badeten. Nach einer halben Stunde schien wieder die Sonne. Am besten gefielen allen die Pinguine, weil einer immer wieder ins Wasser rutschte. Müde, aber fröhlich kamen die Kinder am Nachmittag zurück.',
    source: 'Eigener Text.',
    items: [
      { type: 'choice', text: 'Womit fuhr die Klasse in den Tierpark?', options: ['mit dem Zug', 'mit dem Bus', 'mit dem Fahrrad', 'zu Fuß'], answer: 1 },
      { type: 'choice', text: 'Warum war die Regenjacke nützlich?', options: ['Es war kalt.', 'Es fing an zu regnen.', 'Die Elefanten spritzten.', 'Die Kinder badeten.'], answer: 1 },
      { type: 'tf', text: 'Stimmt die Aussage mit dem Text überein? Entscheide (JA / NEIN).', statements: ['Der Ausflug war an einem Freitag.', 'Es regnete den ganzen Tag.', 'Die Pinguine gefielen den Kindern am besten.', 'Die Kinder kamen am Abend zurück.'], answer: [true, false, true, false] },
      { type: 'choice', text: 'Welches Wort passt am besten zur Stimmung der Kinder am Ende?', options: ['traurig', 'wütend', 'zufrieden', 'ängstlich'], answer: 2 },
    ],
  },
  {
    group: 'de_handy', grades: [10],
    context: 'Immer mehr Schulen diskutieren über ein Handyverbot während des Unterrichts und in den Pausen. Befürworter argumentieren, dass Smartphones die Konzentration stören und Cybermobbing begünstigen. Außerdem würden Schülerinnen und Schüler sich in den Pausen wieder mehr miteinander unterhalten und bewegen. Kritiker halten dagegen, dass ein Verbot an der Lebenswirklichkeit vorbeigehe. Jugendliche müssten lernen, verantwortungsvoll mit digitalen Medien umzugehen – und das gelinge nicht, indem man Geräte einfach wegsperre. Einige Schulen setzen deshalb auf einen Mittelweg: Im Unterricht bleibt das Handy in der Tasche, es sei denn, die Lehrkraft erlaubt die Nutzung für eine Aufgabe.',
    source: 'Eigener Text.',
    items: [
      { type: 'choice', text: 'Welche Aussage gibt die Position der Kritiker richtig wieder?', options: ['Handys stören die Konzentration.', 'Jugendliche sollen den richtigen Umgang mit Medien lernen.', 'In den Pausen sollte man sich mehr bewegen.', 'Handys sollten weggesperrt werden.'], answer: 1 },
      { type: 'choice', text: 'Was ist mit dem „Mittelweg“ gemeint?', options: ['ein komplettes Handyverbot', 'gar keine Regeln', 'Handynutzung im Unterricht nur mit Erlaubnis', 'Handys nur in den Pausen verbieten'], answer: 2 },
      { type: 'tf', text: 'Stimmt die Aussage mit dem Text überein? Entscheide (JA / NEIN).', statements: ['Befürworter sehen einen Zusammenhang mit Cybermobbing.', 'Alle Schulen haben bereits ein Handyverbot.', 'Kritiker halten ein Verbot für realitätsfern.', 'Der Text vertritt eindeutig die Meinung der Befürworter.'], answer: [true, false, true, false] },
      { type: 'choice', text: 'Um welche Textsorte handelt es sich am ehesten?', options: ['Erzählung', 'Sachtext, der verschiedene Positionen darstellt', 'Gedicht', 'Gebrauchsanweisung'], answer: 1 },
    ],
  },
  {
    group: 'de_wasser', grades: [10],
    context: 'Wer in Deutschland den Wasserhahn aufdreht, denkt selten darüber nach, wie viel Wasser er eigentlich verbraucht. Pro Kopf und Tag sind es durchschnittlich rund 125 Liter – für Duschen, Toilettenspülung, Wäsche und Kochen. Noch viel größer ist jedoch das sogenannte virtuelle Wasser: die Menge, die bei der Herstellung von Produkten verbraucht wird. Für eine einzige Tasse Kaffee werden zum Beispiel etwa 130 Liter benötigt, wenn man den Anbau der Bohnen mitrechnet. Experten empfehlen daher, nicht nur im Bad zu sparen, sondern auch beim Einkaufen bewusst zu entscheiden – etwa regionale und saisonale Lebensmittel zu wählen.',
    source: 'Eigener Text.',
    items: [
      { type: 'choice', text: 'Was versteht der Text unter „virtuellem Wasser“?', options: ['Wasser aus dem Internet', 'Wasser, das bei der Herstellung von Produkten verbraucht wird', 'Regenwasser', 'Wasser zum Duschen'], answer: 1 },
      { type: 'choice', text: 'Welche Empfehlung geben die Experten?', options: ['nur noch kalt duschen', 'keinen Kaffee mehr trinken', 'auch beim Einkaufen bewusst entscheiden', 'mehr Wasser kaufen'], answer: 2 },
      { type: 'tf', text: 'Stimmt die Aussage mit dem Text überein? Entscheide (JA / NEIN).', statements: ['Der tägliche Verbrauch pro Kopf liegt bei etwa 125 Litern.', 'Virtuelles Wasser ist weniger als das Wasser im Haushalt.', 'Für eine Tasse Kaffee braucht man rund 130 Liter Wasser.', 'Regionale Lebensmittel werden empfohlen.'], answer: [true, false, true, true] },
      { type: 'choice', text: 'Welche Absicht verfolgt der Text vor allem?', options: ['unterhalten', 'informieren und zum Nachdenken anregen', 'für ein Produkt werben', 'eine Geschichte erzählen'], answer: 1 },
    ],
  },
];

export function readingGroups(grade) {
  const g = grade >= 7 ? 10 : 4;
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

// only for grade 4 (k4) or grade 10 (k10); null → the engine picks another generator
const k4 = (fn) => (r, ctx) => (g10(ctx) ? null : fn(r, ctx));
const k10 = (fn) => (r, ctx) => (g10(ctx) ? fn(r, ctx) : null);

export const GERMAN_GENERATORS = {
  de_rechtschreibung: [allCorrect, wordTF, k4(sss), k4(sss), capital, k10(dassDas), k10(dassDas)],
  de_grammatik: [
    k4(artikel), k4(plural), wortart, zeitform, konjugation, satzglied, steigerung, k10(satzglied), k10(g10Grammar), k10(g10Grammar),
  ],
  de_zeichensetzung: [komma, komma, kommaTF],
  de_wortschatz: [gegenteil, k4(oberbegriff), wortfamilie, k10(redewendung), k10(fremdwort)],
  de_lesen: [readingPick],
};

export function germanGeneratorsFor(topic) {
  return GERMAN_GENERATORS[topic] || [];
}

export const GERMAN_LISTS = { WORDS4, WORDS10, ARTIKEL, KONJ, READING };
