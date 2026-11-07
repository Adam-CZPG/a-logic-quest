// English – original tasks for CEFR levels A1, A2, B1 (ctx.level).
// Content is always in English; the interface around it is in the child's language.

// right answer + up to 3 distinct wrong ones (padding from a spare list when needed)
function four(r, right, wrong, spare = []) {
  const w = [...new Set([...wrong, ...spare])].filter((x) => x && x !== right).slice(0, 3);
  const options = r.shuffle([right, ...w]);
  return { options, answer: options.indexOf(right) };
}

const lv = (ctx) => ({ A1: 1, A2: 2, B1: 3 })[ctx.level] || 1;
const gapText = 'Choose the correct word to complete the sentence.';

// ---------------------------------------------------------------- grammar
// [noun, article] – a/an by sound
const AN_WORDS = [
  ['apple', 'an'], ['egg', 'an'], ['orange', 'an'], ['umbrella', 'an'], ['elephant', 'an'], ['island', 'an'], ['hour', 'an'],
  ['old car', 'an'], ['ice cream', 'an'], ['banana', 'a'], ['dog', 'a'], ['university', 'a'], ['house', 'a'], ['uniform', 'a'],
  ['big apple', 'a'], ['horse', 'a'], ['European city', 'a'], ['honest boy', 'an'], ['car', 'a'], ['one-way ticket', 'a'],
];
function articleAAn(r, ctx) {
  const pool = lv(ctx) === 1 ? AN_WORDS.filter(([w]) => !/honest|hour|university|uniform|European|one-way/.test(w)) : AN_WORDS;
  const [w, art] = r.pick(pool);
  const opts = ['a', 'an'];
  const tricky = /honest|hour|university|uniform|European|one-way/.test(w);
  return {
    type: 'choice', text: gapText, expr: `I can see ___ ${w}.`, options: opts, answer: opts.indexOf(art),
    explain: `${art} ${w}${tricky ? ' – we decide by the first sound, not the first letter.' : ''}`,
  };
}

const PLURALS = [
  ['child', 'children', 'childs'], ['mouse', 'mice', 'mouses'], ['tooth', 'teeth', 'tooths'], ['foot', 'feet', 'foots'],
  ['man', 'men', 'mans'], ['woman', 'women', 'womans'], ['person', 'people', 'persons'], ['box', 'boxes', 'boxs'],
  ['baby', 'babies', 'babys'], ['knife', 'knives', 'knifes'], ['leaf', 'leaves', 'leafs'], ['sheep', 'sheep', 'sheeps'],
  ['bus', 'buses', 'bus'], ['city', 'cities', 'citys'], ['potato', 'potatoes', 'potatos'], ['wife', 'wives', 'wifes'],
];
function plural(r) {
  const [one, many, wrong] = r.pick(PLURALS);
  const o = four(r, many, [wrong, `${many}s`, `${one}es`], [`${one}en`, `${one}ies`]);
  return { type: 'choice', text: `What is the plural of "${one}"?`, ...o, explain: `one ${one} – two ${many}` };
}

// [adjective, comparative, superlative]
// [adjective, comparative, superlative, thing it describes]
const COMPARE = [
  ['big', 'bigger', 'biggest', 'house'], ['small', 'smaller', 'smallest', 'room'], ['hot', 'hotter', 'hottest', 'day'], ['happy', 'happier', 'happiest', 'dog'],
  ['easy', 'easier', 'easiest', 'test'], ['good', 'better', 'best', 'film'], ['bad', 'worse', 'worst', 'idea'], ['tall', 'taller', 'tallest', 'tree'],
  ['beautiful', 'more beautiful', 'most beautiful', 'garden'], ['expensive', 'more expensive', 'most expensive', 'phone'],
  ['interesting', 'more interesting', 'most interesting', 'book'], ['fast', 'faster', 'fastest', 'car'], ['funny', 'funnier', 'funniest', 'joke'],
  ['thin', 'thinner', 'thinnest', 'book'], ['heavy', 'heavier', 'heaviest', 'bag'],
];
function comparison(r, ctx) {
  const [a, comp, sup, noun] = r.pick(COMPARE);
  const useSup = lv(ctx) > 1 && r.chance(0.5);
  if (useSup) {
    const o = four(r, sup, [comp, `${a}est`, `more ${sup}`], [`most ${comp}`, a]);
    return { type: 'choice', text: gapText, expr: `This is the ___ ${noun} of all. (${a})`, ...o, explain: `${a} – ${comp} – the ${sup}` };
  }
  const o = four(r, comp, [`more ${comp}`, `${a}er`, sup], [`most ${a}`, a]);
  return { type: 'choice', text: gapText, expr: `This ${noun} is ___ than that one. (${a})`, ...o, explain: `${a} – ${comp} – the ${sup}` };
}

const PREP_TIME = [
  ['at', '7 o\'clock'], ['at', 'night'], ['at', 'midnight'], ['at', 'half past three'],
  ['on', 'Monday'], ['on', 'my birthday'], ['on', '5 May'], ['on', 'Sunday morning'],
  ['in', 'July'], ['in', '2015'], ['in', 'the morning'], ['in', 'winter'], ['in', 'the evening'],
];
function prepositionTime(r) {
  const [p, w] = r.pick(PREP_TIME);
  const opts = ['at', 'on', 'in'];
  return {
    type: 'choice', text: gapText, expr: `We usually meet ___ ${w}.`, options: opts, answer: opts.indexOf(p),
    explain: `${p} ${w} – at + clock times, on + days and dates, in + months, years, seasons, parts of the day.`,
  };
}

// [sentence with ___, pronoun asked for, right, wrong…]
const PRONOUNS = [
  ['This is ___ bag. (I)', 'my', 'me', 'mine', 'I'], ['Can you help ___? (we)', 'us', 'our', 'we', 'ours'],
  ['I like ___ very much. (she)', 'her', 'she', 'hers', 'his'], ['___ is my best friend. (he)', 'He', 'Him', 'His', 'Her'],
  ['The cat is eating ___ food. (it)', 'its', 'it\'s', 'it', 'their'], ['Is this book ___? (you)', 'yours', 'your', 'you', 'you\'re'],
  ['They lost ___ keys. (they)', 'their', 'there', 'them', 'they\'re'], ['Please call ___ tomorrow. (I)', 'me', 'my', 'I', 'mine'],
];
function pronoun(r) {
  const [sent, right, ...wrong] = r.pick(PRONOUNS);
  const options = r.shuffle([right, ...wrong]);
  return { type: 'choice', text: gapText, expr: sent, options, answer: options.indexOf(right), explain: sent.replace('___', right).replace(/ \(.*\)$/, '') };
}

const QUANT = [
  ['How ___ apples do you want?', 'many', ['much', 'any', 'a lot']], ['How ___ water do you drink a day?', 'much', ['many', 'some', 'few']],
  ['There isn\'t ___ milk in the fridge.', 'any', ['some', 'many', 'a']], ['Would you like ___ cake?', 'some', ['any', 'many', 'a few']],
  ['I have ___ friends in London – only two.', 'a few', ['a little', 'much', 'any']], ['We have ___ time, so let\'s hurry.', 'little', ['few', 'many', 'a few']],
  ['Are there ___ shops near your house?', 'any', ['some', 'much', 'a little']], ['There are ___ people in the park today.', 'a lot of', ['much', 'a little', 'any']],
];
function quantifier(r) {
  const [sent, right, wrong] = r.pick(QUANT);
  const options = r.shuffle([right, ...wrong]);
  return { type: 'choice', text: gapText, expr: sent, options, answer: options.indexOf(right), explain: sent.replace('___', right) };
}

// B1 structures
const B1_GRAMMAR = [
  ['If it rains tomorrow, we ___ at home.', 'will stay', ['would stay', 'stayed', 'stay'], 'First conditional: if + present, will + verb.'],
  ['If I had more money, I ___ a new bike.', 'would buy', ['will buy', 'buy', 'bought'], 'Second conditional: if + past, would + verb.'],
  ['The bridge ___ in 1890.', 'was built', ['built', 'is building', 'has built'], 'Passive: was/were + past participle.'],
  ['English ___ in many countries.', 'is spoken', ['speaks', 'is speaking', 'spoke'], 'Passive in the present: is/are + past participle.'],
  ['The girl ___ lives next door is my cousin.', 'who', ['which', 'where', 'what'], 'who – for people.'],
  ['This is the town ___ I was born.', 'where', ['which', 'who', 'when'], 'where – for places.'],
  ['The film ___ we saw yesterday was great.', 'which', ['who', 'where', 'whose'], 'which – for things.'],
  ['You ___ wear a helmet when you ride a bike. It\'s the rule.', 'must', ['mustn\'t', 'don\'t have to', 'might'], 'must – something is necessary.'],
  ['You ___ smoke here. It\'s forbidden.', 'mustn\'t', ['don\'t have to', 'must', 'needn\'t to'], 'mustn\'t – something is not allowed.'],
  ['It\'s Saturday, so I ___ get up early.', 'don\'t have to', ['mustn\'t', 'must', 'have'], 'don\'t have to – it is not necessary.'],
  ['You look tired. You ___ go to bed.', 'should', ['shouldn\'t', 'would', 'will'], 'should – advice.'],
  ['She asked me where I ___.', 'lived', ['live', 'do live', 'am living'], 'Reported speech: present → past.'],
  ['I\'m looking forward to ___ you.', 'seeing', ['see', 'to see', 'saw'], 'look forward to + -ing.'],
  ['He is used to ___ early.', 'getting up', ['get up', 'got up', 'gets up'], 'be used to + -ing.'],
];
function b1Grammar(r) {
  const [sent, right, wrong, why] = r.pick(B1_GRAMMAR);
  const options = r.shuffle([right, ...wrong]);
  return { type: 'choice', text: gapText, expr: sent, options, answer: options.indexOf(right), explain: why };
}


// ---------------------------------------------------------------- tenses
// [base, past simple, past participle, 3rd person, -ing]
const VERBS = [
  ['go', 'went', 'gone', 'goes', 'going'], ['see', 'saw', 'seen', 'sees', 'seeing'], ['buy', 'bought', 'bought', 'buys', 'buying'],
  ['eat', 'ate', 'eaten', 'eats', 'eating'], ['take', 'took', 'taken', 'takes', 'taking'], ['write', 'wrote', 'written', 'writes', 'writing'],
  ['drink', 'drank', 'drunk', 'drinks', 'drinking'], ['swim', 'swam', 'swum', 'swims', 'swimming'], ['come', 'came', 'come', 'comes', 'coming'],
  ['think', 'thought', 'thought', 'thinks', 'thinking'], ['catch', 'caught', 'caught', 'catches', 'catching'], ['teach', 'taught', 'taught', 'teaches', 'teaching'],
  ['fly', 'flew', 'flown', 'flies', 'flying'], ['begin', 'began', 'begun', 'begins', 'beginning'], ['break', 'broke', 'broken', 'breaks', 'breaking'],
  ['sleep', 'slept', 'slept', 'sleeps', 'sleeping'], ['leave', 'left', 'left', 'leaves', 'leaving'], ['find', 'found', 'found', 'finds', 'finding'],
  ['play', 'played', 'played', 'plays', 'playing'], ['watch', 'watched', 'watched', 'watches', 'watching'], ['study', 'studied', 'studied', 'studies', 'studying'],
  ['make', 'made', 'made', 'makes', 'making'], ['run', 'ran', 'run', 'runs', 'running'], ['read', 'read', 'read', 'reads', 'reading'],
];
// what goes after each verb, so the sentences make sense
const OBJ = {
  go: 'to the cinema', see: 'a rainbow', buy: 'a new bag', eat: 'pizza', take: 'a lot of photos', write: 'a letter', drink: 'lemonade',
  swim: 'in the lake', come: 'home late', think: 'about the test', catch: 'a big fish', teach: 'my brother to ski', fly: 'to Rome',
  begin: 'a new book', break: 'a glass', sleep: 'for ten hours', leave: 'the party early', find: 'a coin', play: 'tennis',
  watch: 'cartoons', study: 'maths', make: 'pancakes', run: 'in the park', read: 'comics',
};
const IRREGULAR = VERBS.filter((v) => v[1] !== `${v[0]}ed` && !/ied$/.test(v[1]) && !['played', 'watched'].includes(v[1]));
const WHO = [['She', 3], ['My dad', 3], ['Tom', 3], ['I', 1], ['We', 1], ['They', 1], ['My friends', 1]];

function presentSimple(r) {
  const [subj, p] = r.pick(WHO);
  const v = r.pick(VERBS.filter((x) => !['break', 'begin', 'leave', 'fly', 'catch', 'think', 'find', 'come', 'see'].includes(x[0])));
  const right = p === 3 ? v[3] : v[0];
  const when = r.pick(['every weekend', 'on Fridays', 'every day', 'twice a week']);
  const o = four(r, right, [p === 3 ? v[0] : v[3], `is ${v[4]}`, v[1]]);
  return {
    type: 'choice', text: gapText, expr: `${subj} ___ ${OBJ[v[0]]} ${when}. (${v[0]})`, ...o,
    explain: `Present simple: ${subj} ${right}${p === 3 ? ' (he / she / it + -s)' : ''}.`,
  };
}
function presentContinuous(r) {
  const [subj, p] = r.pick(WHO.filter((w) => w[0] !== 'I'));
  const v = r.pick(VERBS.filter((x) => ['eat', 'swim', 'write', 'run', 'read', 'play', 'watch', 'make', 'drink'].includes(x[0])));
  const be = p === 3 ? 'is' : 'are';
  const right = `${be} ${v[4]}`;
  const o = four(r, right, [p === 3 ? v[3] : v[0], `${be} ${v[0]}`, v[1]]);
  return {
    type: 'choice', text: gapText, expr: `Look! ${subj} ___ ${OBJ[v[0]]} right now. (${v[0]})`, ...o,
    explain: `Present continuous (happening now): ${subj} ${right}.`,
  };
}
function pastSimple(r, ctx) {
  const v = r.pick(IRREGULAR);
  if (lv(ctx) >= 2 && r.chance(0.4)) {
    // open answer: write the past form
    return { type: 'text', text: `Write the past simple of the verb "${v[0]}".`, answer: [v[1]], explain: `${v[0]} – ${v[1]} – ${v[2]}` };
  }
  const subj = r.pick(['we', 'I', 'my sister', 'they']);
  const o = four(r, v[1], [`${v[0]}ed`, v[2], v[0]], [`${v[0]}s`, v[4]]);
  return {
    type: 'choice', text: gapText, expr: `Yesterday ${subj} ___ ${OBJ[v[0]]}. (${v[0]})`, ...o,
    explain: `${v[0]} – ${v[1]} (irregular verb)`,
  };
}
function timeMarker(r) {
  // which tense goes with the time word?
  const items = [
    ['I ___ my homework yesterday.', 'did', ['do', 'have done', 'am doing']],
    ['She ___ to school every day.', 'walks', ['walked', 'is walking', 'walk']],
    ['Listen! The baby ___.', 'is crying', ['cries', 'cried', 'cry']],
    ['We ___ our grandma next Sunday.', 'are going to visit', ['visited', 'visit', 'have visited']],
    ['Two years ago we ___ in Prague.', 'lived', ['live', 'have lived', 'are living']],
    ['He usually ___ coffee in the morning.', 'drinks', ['is drinking', 'drank', 'drink']],
  ];
  const [sent, right, wrong] = r.pick(items);
  const options = r.shuffle([right, ...wrong]);
  return { type: 'choice', text: gapText, expr: sent, options, answer: options.indexOf(right), explain: sent.replace('___', right) };
}
const B1_TENSES = [
  ['I have never ___ to London.', 'been', ['was', 'be', 'went'], 'Present perfect: have + past participle (been).'],
  ['We have lived here ___ 2019.', 'since', ['for', 'from', 'ago'], 'since + a point in time.'],
  ['They have known each other ___ ten years.', 'for', ['since', 'ago', 'during'], 'for + a period of time.'],
  ['I ___ TV when the phone rang.', 'was watching', ['watched', 'am watching', 'have watched'], 'Past continuous for the longer action.'],
  ['___ you ever ___ sushi?', 'Have … eaten', ['Did … eat', 'Are … eating', 'Do … eat'], 'Experience → present perfect.'],
  ['She ___ her keys, so she can\'t open the door.', 'has lost', ['lost', 'loses', 'was losing'], 'Present result → present perfect.'],
  ['When I arrived, the film ___ already ___.', 'had … started', ['has … started', 'was … starting', 'did … start'], 'Past perfect: an action before another past action.'],
  ['Look at those clouds! It ___ rain.', 'is going to', ['will', 'rains', 'is raining'], 'going to – a prediction from what we can see.'],
  ['I think people ___ on Mars one day.', 'will live', ['are living', 'live', 'lived'], 'will – a prediction or opinion.'],
  ['How long ___ you ___ English?', 'have … been learning', ['did … learn', 'are … learning', 'do … learn'], 'Present perfect continuous: how long + until now.'],
];
function b1Tenses(r) {
  const [sent, right, wrong, why] = r.pick(B1_TENSES);
  const options = r.shuffle([right, ...wrong]);
  return { type: 'choice', text: gapText, expr: sent, options, answer: options.indexOf(right), explain: why };
}

// ---------------------------------------------------------------- vocabulary
const OPPOSITES = [
  ['hot', 'cold'], ['big', 'small'], ['happy', 'sad'], ['fast', 'slow'], ['old', 'new'], ['open', 'closed'], ['cheap', 'expensive'],
  ['early', 'late'], ['easy', 'difficult'], ['full', 'empty'], ['strong', 'weak'], ['loud', 'quiet'], ['light', 'heavy'], ['clean', 'dirty'],
  ['always', 'never'], ['buy', 'sell'], ['win', 'lose'], ['arrive', 'leave'], ['remember', 'forget'], ['push', 'pull'],
];
function opposite(r) {
  const [a, b] = r.pick(OPPOSITES);
  const flip = r.chance(0.5);
  const word = flip ? b : a, right = flip ? a : b;
  const pool = OPPOSITES.flat().filter((w) => w !== a && w !== b);
  const options = r.shuffle([right, ...r.sample(pool, 3)]);
  return { type: 'choice', text: `Which word is the opposite of "${word}"?`, options, answer: options.indexOf(right), explain: `${word} ↔ ${right}` };
}
const GROUPS = {
  fruit: ['apple', 'banana', 'pear', 'cherry', 'grape', 'lemon'], animals: ['horse', 'rabbit', 'tiger', 'sheep', 'duck', 'mouse'],
  clothes: ['shirt', 'jacket', 'skirt', 'sock', 'scarf', 'coat'], school: ['ruler', 'pencil', 'rubber', 'notebook', 'desk', 'board'],
  jobs: ['doctor', 'teacher', 'farmer', 'pilot', 'nurse', 'baker'], weather: ['rain', 'snow', 'wind', 'fog', 'sunshine', 'storm'],
  body: ['knee', 'elbow', 'shoulder', 'finger', 'ankle', 'neck'], transport: ['train', 'bus', 'plane', 'ship', 'tram', 'bike'],
};
function oddOne(r) {
  const [g, other] = r.sample(Object.keys(GROUPS), 2);
  const three = r.sample(GROUPS[g], 3);
  const odd = r.pick(GROUPS[other]);
  const options = r.shuffle([...three, odd]);
  return { type: 'choice', text: 'Which word does NOT belong to the group?', options, answer: options.indexOf(odd), explain: `${three.join(', ')} – ${g}; ${odd} – ${other}` };
}
const DEFINITIONS = [
  ['a person who works in a hospital and looks after ill people', 'nurse'], ['a place where you can borrow books', 'library'],
  ['the meal you eat in the morning', 'breakfast'], ['a person who flies a plane', 'pilot'], ['the day after today', 'tomorrow'],
  ['a room where you cook', 'kitchen'], ['you use it to cut paper', 'scissors'], ['the opposite of "north"', 'south'],
  ['a shop where you buy bread and cakes', 'bakery'], ['a person who sells things in a shop', 'shop assistant'],
  ['the season after winter', 'spring'], ['a large area of land with a lot of trees', 'forest'],
];
function definition(r) {
  const [def, word] = r.pick(DEFINITIONS);
  const options = r.shuffle([word, ...r.sample(DEFINITIONS.filter((d) => d[1] !== word).map((d) => d[1]), 3)]);
  return { type: 'choice', text: `Which word matches the definition: ${def}?`, options, answer: options.indexOf(word) };
}
const MAKE_DO = [
  ['homework', 'do'], ['a mistake', 'make'], ['a cake', 'make'], ['the shopping', 'do'], ['friends', 'make'], ['the washing-up', 'do'],
  ['a phone call', 'make'], ['sport', 'do'], ['a decision', 'make'], ['your best', 'do'], ['noise', 'make'], ['an exam', 'do'],
];
function makeDo(r) {
  const [obj, verb] = r.pick(MAKE_DO);
  const opts = ['make', 'do'];
  return { type: 'choice', text: gapText, expr: `I need to ___ ${obj}.`, options: opts, answer: opts.indexOf(verb), explain: `${verb} ${obj}` };
}
const SYN_B1 = [
  ['begin', 'start'], ['big', 'large'], ['quick', 'fast'], ['angry', 'cross'], ['shut', 'close'], ['choose', 'pick'],
  ['correct', 'right'], ['enormous', 'huge'], ['frightened', 'scared'], ['rich', 'wealthy'],
];
function synonym(r) {
  const [a, b] = r.pick(SYN_B1);
  const pool = SYN_B1.flat().filter((w) => w !== a && w !== b);
  const options = r.shuffle([b, ...r.sample(pool, 3)]);
  return { type: 'choice', text: `Which word has a similar meaning to "${a}"?`, options, answer: options.indexOf(b), explain: `${a} = ${b}` };
}

// ---------------------------------------------------------------- communication
// [what someone says, best answer, wrong answers, min level]
const DIALOGUES = [
  ['How are you?', 'Fine, thanks. And you?', ['I\'m twelve.', 'It\'s Monday.', 'Yes, I am.'], 1],
  ['Thank you for your help!', 'You\'re welcome.', ['Yes, please.', 'Nice to meet you.', 'I\'m sorry.'], 1],
  ['What\'s your name?', 'My name is Eva.', ['I\'m from Brno.', 'It\'s blue.', 'Yes, it is.'], 1],
  ['Would you like some tea?', 'Yes, please.', ['Yes, I would like.', 'I\'m fine.', 'It\'s hot.'], 1],
  ['Where are you from?', 'I\'m from Poland.', ['I\'m going home.', 'From nine o\'clock.', 'In the evening.'], 1],
  ['Can I borrow your pen?', 'Sure, here you are.', ['Yes, I can.', 'No, I don\'t.', 'It\'s my.'], 1],
  ['What time is it?', 'It\'s half past three.', ['It\'s Tuesday.', 'I have time.', 'At school.'], 1],
  ['Sorry I\'m late.', 'That\'s OK. Come in.', ['You\'re welcome.', 'Yes, please.', 'Me too.'], 2],
  ['Can I help you?', 'Yes, I\'m looking for a T-shirt.', ['Yes, you can.', 'No, I can\'t.', 'Help me, please, yes.'], 2],
  ['How much is this cap?', 'It\'s eight pounds.', ['It\'s very big.', 'Two, please.', 'It\'s mine.'], 2],
  ['What\'s the weather like?', 'It\'s sunny and warm.', ['I like summer.', 'It\'s Friday.', 'It\'s a coat.'], 2],
  ['Shall we go to the cinema tonight?', 'That\'s a great idea!', ['Yes, we shall go.', 'I went yesterday tonight.', 'It\'s in the cinema.'], 2],
  ['Do you mind if I open the window?', 'No, go ahead.', ['Yes, go ahead.', 'No, I don\'t like it open.', 'I mind.'], 3],
  ['I\'m afraid I can\'t come to your party.', 'What a pity! Maybe next time.', ['Don\'t be afraid.', 'Congratulations!', 'Yes, you can.'], 3],
  ['Could you tell me the way to the station?', 'Go straight on and turn left at the lights.', ['Yes, I could.', 'The station is a building.', 'By train.'], 3],
  ['I passed my driving test!', 'Congratulations!', ['Bad luck.', 'Never mind.', 'Excuse me.'], 3],
  ['Have you finished the project yet?', 'Not yet, but I\'m almost done.', ['Yes, I finish.', 'No, I haven\'t project.', 'Yet.'], 3],
];
function dialogue(r, ctx) {
  const l = lv(ctx);
  const [said, right, wrong] = r.pick(DIALOGUES.filter((d) => d[3] <= l));
  const options = r.shuffle([right, ...wrong]);
  return { type: 'choice', text: `Choose the best answer: "${said}"`, options, answer: options.indexOf(right) };
}
function dialogueTF(r, ctx) {
  const l = lv(ctx);
  const pool = r.sample(DIALOGUES.filter((d) => d[3] <= l), 4);
  const answer = pool.map(() => r.chance(0.5));
  const statements = pool.map((d, i) => `A: "${d[0]}" – B: "${answer[i] ? d[1] : r.pick(d[2])}"`);
  return { type: 'tf', text: 'Is B\'s answer a good reply to A? Decide for each mini-dialogue (YES / NO).', statements, answer };
}

// ---------------------------------------------------------------- reading (original texts)
const READING = [
  {
    group: 'en_pet', levels: ['A1', 'A2'],
    context: 'My name is Lily and I am eleven. I have a dog called Max. He is brown and white and he is three years old. Every morning before school I take Max for a walk in the park. He loves running after balls, but he doesn\'t like the rain. On Saturdays my brother and I wash Max in the garden. He hates it! After that we give him a big biscuit.',
    source: 'Original text.',
    items: [
      { type: 'choice', text: 'How old is Max?', options: ['one', 'three', 'eleven', 'We don\'t know.'], answer: 1 },
      { type: 'choice', text: 'When does Lily walk Max?', options: ['in the evening', 'after school', 'before school', 'on Saturdays only'], answer: 2 },
      { type: 'tf', text: 'Decide if each sentence is true (YES) or false (NO) according to the text.', statements: ['Max likes the rain.', 'Lily has a brother.', 'Max likes being washed.', 'Max gets a biscuit after his bath.'], answer: [false, true, false, true] },
      { type: 'choice', text: 'What does Max love?', options: ['biscuits only', 'running after balls', 'the garden', 'sleeping'], answer: 1 },
    ],
  },
  {
    group: 'en_trip', levels: ['A1', 'A2'],
    context: 'Last summer Jack went to the seaside with his parents. They travelled by train because his dad doesn\'t like driving long distances. The hotel was small but very close to the beach. Every day Jack swam in the sea and built sandcastles with his little sister. One evening there was a big storm, so they stayed in the hotel and played cards. Jack says it was the best holiday ever.',
    source: 'Original text.',
    items: [
      { type: 'choice', text: 'How did the family travel?', options: ['by car', 'by plane', 'by train', 'by bus'], answer: 2 },
      { type: 'choice', text: 'Why did they stay in the hotel one evening?', options: ['Jack was ill.', 'There was a storm.', 'The beach was closed.', 'They were tired.'], answer: 1 },
      { type: 'tf', text: 'Decide if each sentence is true (YES) or false (NO) according to the text.', statements: ['The hotel was far from the beach.', 'Jack has a little sister.', 'Jack didn\'t enjoy the holiday.', 'The family played cards.'], answer: [false, true, false, true] },
      { type: 'choice', text: 'What did Jack do every day?', options: ['He played cards.', 'He swam in the sea.', 'He drove a car.', 'He read books.'], answer: 1 },
    ],
  },
  {
    group: 'en_club', levels: ['A2', 'B1'],
    context: 'NEW AT CITY LIBRARY: Teen Book Club\nAre you 12–16 and do you love stories? Join our book club! We meet every second Thursday from 4 to 5.30 pm in Room 3 on the first floor. Each month we read one book together and talk about it. You don\'t need to buy anything – we lend the books for free. Snacks and drinks are provided. To join, write your name on the list at the main desk or send an email to bookclub@citylibrary.example. Places are limited to 15 members.',
    source: 'Original text.',
    items: [
      { type: 'choice', text: 'How often does the club meet?', options: ['every Thursday', 'every two weeks', 'once a month', 'every day'], answer: 1 },
      { type: 'choice', text: 'What do members have to pay for?', options: ['the books', 'the snacks', 'nothing', 'the room'], answer: 2 },
      { type: 'tf', text: 'Decide if each sentence is true (YES) or false (NO) according to the text.', statements: ['A ten-year-old can join the club.', 'The club meets on the first floor.', 'Any number of people can join.', 'You can sign up at the main desk.'], answer: [false, true, false, true] },
      { type: 'choice', text: 'What is the main purpose of the text?', options: ['to sell books', 'to invite young people to a club', 'to describe a library', 'to explain library rules'], answer: 1 },
    ],
  },
  {
    group: 'en_phone', levels: ['A2', 'B1'],
    context: 'Mia got her first smartphone when she was twelve. At first she used it all the time – at breakfast, on the bus and even in bed. Her marks at school started to get worse and she often felt tired. Her mum didn\'t take the phone away. Instead, they made a deal: no phone after 8 pm and no phone at the table. Mia found it hard for the first week, but then she started reading again and sleeping better. "I still love my phone," she says, "but now I\'m the boss, not the phone."',
    source: 'Original text.',
    items: [
      { type: 'choice', text: 'What happened when Mia used her phone all the time?', options: ['She slept better.', 'Her marks got worse.', 'She read more books.', 'Her mum was happy.'], answer: 1 },
      { type: 'choice', text: 'What did Mia\'s mum do?', options: ['She took the phone away.', 'She bought a new phone.', 'She agreed some rules with Mia.', 'She called the school.'], answer: 2 },
      { type: 'choice', text: 'What does Mia mean by "now I\'m the boss, not the phone"?', options: ['She has a job now.', 'She controls how she uses the phone.', 'She doesn\'t use the phone any more.', 'She bought a better phone.'], answer: 1 },
      { type: 'tf', text: 'Decide if each sentence is true (YES) or false (NO) according to the text.', statements: ['The new rules were easy from the first day.', 'Mia can\'t use the phone at the table.', 'Mia started reading again.', 'Mia now hates her phone.'], answer: [false, true, true, false] },
    ],
  },
  {
    group: 'en_bees', levels: ['B1'],
    context: 'Bees are much more important than most people realise. About one third of the food we eat depends on pollination, and bees do a large part of this work. Without them, fruits such as apples and cherries would become rare and expensive. Unfortunately, bee numbers have fallen in many countries. Scientists believe that the main reasons are pesticides, the loss of wild flowers and diseases. The good news is that everyone can help. Planting flowers on a balcony, leaving a corner of the garden wild or buying honey from local beekeepers all make a difference.',
    source: 'Original text.',
    items: [
      { type: 'choice', text: 'What is the main idea of the text?', options: ['Honey is healthy.', 'Bees are important and need our help.', 'Apples are expensive.', 'Scientists study diseases.'], answer: 1 },
      { type: 'choice', text: 'According to the text, what could happen without bees?', options: ['There would be more flowers.', 'Some fruits would be rare and expensive.', 'People would eat more honey.', 'Pesticides would disappear.'], answer: 1 },
      { type: 'tf', text: 'Decide if each sentence is true (YES) or false (NO) according to the text.', statements: ['Bees pollinate all the food we eat.', 'Pesticides may be one reason why bee numbers have fallen.', 'Only scientists can help bees.', 'A wild corner in a garden can help bees.'], answer: [false, true, false, true] },
      { type: 'choice', text: 'Which word in the text means "not common"?', options: ['important', 'rare', 'local', 'wild'], answer: 1 },
    ],
  },
  {
    group: 'en_volunteer', levels: ['B1'],
    context: 'When Daniel was fifteen, he started volunteering at an animal shelter every Saturday morning. His job was simple: cleaning cages, feeding the cats and taking dogs for walks. "I thought it would be boring," he admits, "but it changed me." He learned to be patient with frightened animals and responsible for others. Last year he helped organise an open day which raised enough money to repair the shelter\'s roof. Now Daniel wants to study to become a vet. "If I hadn\'t gone there that first Saturday," he says, "I wouldn\'t know what I want to do."',
    source: 'Original text.',
    items: [
      { type: 'choice', text: 'What did Daniel expect before he started?', options: ['that it would be boring', 'that it would be dangerous', 'that he would earn money', 'that he would become a vet'], answer: 0 },
      { type: 'choice', text: 'What was the open day for?', options: ['to find homes for cats', 'to raise money for repairs', 'to train new volunteers', 'to celebrate his birthday'], answer: 1 },
      { type: 'tf', text: 'Decide if each sentence is true (YES) or false (NO) according to the text.', statements: ['Daniel volunteered on weekday afternoons.', 'He learned to be patient.', 'The shelter got a new roof thanks to the open day.', 'Daniel already works as a vet.'], answer: [false, true, true, false] },
      { type: 'choice', text: 'What does the last sentence show?', options: ['Daniel regrets volunteering.', 'Volunteering helped Daniel choose his future.', 'Daniel forgot the first Saturday.', 'Daniel didn\'t like the animals.'], answer: 1 },
    ],
  },
];

export function readingGroups(level) {
  return READING.filter((g) => g.levels.includes(level));
}

function readingPick(r, ctx) {
  const pool = [];
  readingGroups(ctx.level).forEach((g) => g.items.forEach((it, i) => pool.push({ ...it, context: g.context, source: g.source, group: g.group, groupIndex: i })));
  if (!pool.length) return null;
  const exclude = ctx.exclude || new Set();
  const fresh = pool.filter((p) => !exclude.has(p.text + p.context.slice(0, 20)));
  const q = r.pick(fresh.length ? fresh : pool);
  exclude.add(q.text + q.context.slice(0, 20));
  return { ...q, curated: true };
}

// a generator that only works for some levels (returns null otherwise, the engine then picks another)
const at = (levels, fn) => (r, ctx) => (levels.includes(lv(ctx)) ? fn(r, ctx) : null);

export const ENGLISH_GENERATORS = {
  en_grammar: [
    at([1, 2], articleAAn), at([1, 2], plural), comparison, prepositionTime, at([1, 2], pronoun), at([2, 3], quantifier),
    at([3], b1Grammar), at([3], b1Grammar), at([3], b1Grammar),
  ],
  en_tenses: [
    at([1, 2], presentSimple), presentContinuous, pastSimple, at([2, 3], timeMarker), at([3], b1Tenses), at([3], b1Tenses), at([3], b1Tenses),
  ],
  en_vocab: [opposite, at([1, 2], oddOne), definition, at([2, 3], makeDo), at([3], synonym)],
  en_reading: [readingPick],
  en_communication: [dialogue, dialogue, dialogueTF],
};

export function englishGeneratorsFor(topic) {
  return ENGLISH_GENERATORS[topic] || [];
}

export const ENGLISH_LISTS = { VERBS, IRREGULAR, COMPARE, PLURALS, DIALOGUES, READING };
