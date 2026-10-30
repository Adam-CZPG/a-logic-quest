// Rozšířená banka vlastních (originálních) úloh z češtiny.
// Všechny texty jsou napsané pro tuto aplikaci, nejde o převzaté testy CERMAT.
// Formát je stejný jako CURATED v czech.js: buď skupina s výchozím textem (items),
// nebo samostatná úloha. grades = [od, do].

const TF = 'Rozhodněte o každém z následujících tvrzení, zda odpovídá výchozímu textu (ANO), či nikoli (NE).';
const WHICH = 'Které z následujících tvrzení odpovídá výchozímu textu?';

export const CURATED_EXTRA = [
  // ================================================================ porozumění textu
  {
    group: 'vcely', topic: 'porozumeni', grades: [5, 7],
    context: 'Včelí rodina žije v úlu a tvoří ji jedna královna, několik tisíc dělnic a v létě také trubci. Královna klade vajíčka, trubci se starají o oplodnění nových královen a veškerou ostatní práci obstarávají dělnice. Mladé dělnice nejprve uklízejí buňky a krmí larvy, později stavějí plásty z vosku a teprve nakonec vylétají na květy pro nektar a pyl. Z nektaru vyrábějí med, který je zásobou potravy na zimu. Když včela najde bohatý zdroj potravy, vrátí se do úlu a ostatním ho „ukáže“ zvláštním tancem. Podle směru a rychlosti tance ostatní včely poznají, kterým směrem a jak daleko mají letět.',
    source: 'Původní text.',
    items: [
      { type: 'choice', text: WHICH, options: ['Včelí rodina má několik královen.', 'Dělnice začínají svůj život sběrem nektaru.', 'Med slouží včelám jako zásoba potravy na zimu.', 'Trubci staví plásty z vosku.'], answer: 2, explain: 'Text uvádí, že med je zásobou potravy na zimu.' },
      { type: 'tf', text: TF, statements: ['Mladé dělnice nejdřív krmí larvy a uklízejí buňky.', 'Trubci žijí v úlu po celý rok.', 'Tancem včela sděluje ostatním, kde je potrava.', 'Královna obstarává sběr pylu.'], answer: [true, false, true, false], explain: 'Trubci jsou v úlu „v létě“, pyl sbírají dělnice.' },
      { type: 'choice', text: 'Proč je ve výchozím textu slovo „ukáže“ v uvozovkách?', options: ['Jde o přímou řeč včely.', 'Slovo je užito v přeneseném významu, včela nic neukazuje rukou.', 'Jde o název knihy.', 'Slovo je zapsáno s chybou.'], answer: 1 },
    ],
  },
  {
    group: 'kolo', topic: 'porozumeni', grades: [5, 9],
    context: 'Ondra dostal od strýce staré kolo. Rám byl rezavý, řetěz spadlý a přední kolo se při otáčení kývalo ze strany na stranu. „To už nikdo nespraví,“ mávla rukou sestra Bára. Ondra se ale nevzdal. Celý týden po škole brousil rez, natíral rám na modro a s tátou vyměnil řetěz. Nejvíc ho potrápilo přední kolo, které musel nechat vycentrovat v dílně, protože na to neměl potřebné nářadí. V neděli ráno pak kolo stálo před domem jako nové. Bára chvíli mlčela a pak se zeptala, jestli by si mohla pomoct opravit i to své.',
    source: 'Původní text.',
    items: [
      { type: 'choice', text: 'Které z následujících tvrzení odpovídá výchozímu textu?', options: ['Ondra opravil celé kolo úplně sám.', 'Přední kolo nechal Ondra opravit v dílně.', 'Bára Ondrovi od začátku věřila.', 'Kolo dostal Ondra od táty.'], answer: 1 },
      { type: 'tf', text: TF, statements: ['Řetěz vyměnil Ondra s tátou.', 'Ondra natřel rám na červeno.', 'Oprava trvala jen jeden den.', 'Bára nakonec chtěla opravit i své kolo.'], answer: [true, false, false, true] },
      { type: 'choice', text: 'Co nejlépe vystihuje, jak se změnil postoj Báry?', options: ['Od pohrdání k obdivu a zájmu.', 'Od obdivu k závisti.', 'Od lhostejnosti ke strachu.', 'Její postoj se nezměnil.'], answer: 0 },
    ],
  },
  {
    group: 'pohadka', topic: 'porozumeni', grades: [5, 7],
    context: 'Za devatero horami žil mlynář, který měl tři syny. Nejstarší byl silný, prostřední chytrý a nejmladší Honza prý neuměl nic jiného než pískat na píšťalku. Jednoho dne se v kraji objevil drak, který lidem pil vodu ze studní. Nejstarší bratr ho chtěl porazit mečem, ale drak ho jen odfoukl do potoka. Prostřední bratr se ho pokusil přelstít hádankou, drak však hádanku uhodl dřív, než ji bratr dořekl. Honza si sedl na kámen a začal pískat. Drak zívl, jednou, podruhé, a pak usnul tak tvrdě, že ho lidé odvezli na voze daleko za hory. Od té doby se v mlýně píšťalce nikdo nesmál.',
    source: 'Původní text.',
    items: [
      { type: 'choice', text: 'Jak se Honzovi podařilo zbavit kraj draka?', options: ['Porazil ho mečem.', 'Přelstil ho hádankou.', 'Uspal ho pískáním.', 'Zavřel ho ve mlýně.'], answer: 2 },
      { type: 'choice', text: 'Který z následujících znaků pohádky výchozí text NEOBSAHUJE?', options: ['nadpřirozenou bytost', 'trojí opakování', 'vítězství dobra', 'přesné určení místa a data děje'], answer: 3, explain: 'Místo je neurčité („za devatero horami“) a datum chybí.' },
      { type: 'tf', text: TF, statements: ['Drak lidem pil vodu ze studní.', 'Prostřední bratr byl nejsilnější.', 'Nejstarší bratr skončil v potoce.', 'Lidé se Honzově píšťalce smáli i po porážce draka.'], answer: [true, false, true, false] },
    ],
  },
  {
    group: 'knihovna', topic: 'porozumeni', grades: [5, 9],
    context: 'MĚSTSKÁ KNIHOVNA – OZNÁMENÍ\nOd 1. září se mění otevírací doba dětského oddělení:\npondělí 12:00–18:00, středa 12:00–18:00, pátek 9:00–14:00.\nV úterý a ve čtvrtek je dětské oddělení zavřené.\nKnihy lze vrátit kdykoli do schránky u vchodu.\nPrůkaz pro děti do 15 let je zdarma, stačí podpis rodiče.\nVýpůjční doba je 4 týdny, prodloužit ji lze jednou přes internet.',
    source: 'Původní text.',
    items: [
      { type: 'choice', text: 'Kdy si může žák vypůjčit knihu v dětském oddělení?', options: ['ve čtvrtek v 15:00', 'v úterý v 10:00', 've středu v 16:00', 'v pátek v 15:00'], answer: 2 },
      { type: 'tf', text: TF, statements: ['Dětské oddělení má otevřeno tři dny v týdnu.', 'Knihy lze vracet jen v otevírací době.', 'Dvanáctiletý čtenář platí za průkaz.', 'Výpůjční dobu lze přes internet prodloužit jednou.'], answer: [true, false, false, true] },
      { type: 'number', text: 'Kolik hodin týdně je dětské oddělení otevřené?', answer: 17, unit: 'h', explain: '6 + 6 + 5 = 17' },
    ],
  },
  {
    group: 'dopis', topic: 'porozumeni', grades: [7, 9],
    context: 'Milá Klárko,\nděkuji Ti za dopis i za fotky z tábora. Na té, kde stojíte u ohně, Tě málem nepoznám – vyrostla jsi snad o hlavu! U nás na chalupě je pořád stejně: děda opravuje plot, který už opravoval loni, a kocour Mourek spí na lavičce, jako by se ho nic na světě netýkalo. Letos se nám urodilo tolik švestek, že nevím, kam je dát. Uvařila jsem povidla, upekla buchty a stejně jich ještě zbylo na celou vesnici. Přijeď, prosím, na podzimní prázdniny, budeš mi muset pomoct je sníst.\nMoc Tě pozdravuje\nbabička',
    source: 'Původní text.',
    items: [
      { type: 'choice', text: WHICH, options: ['Babička je smutná, že se švestky neurodily.', 'Klárka poslala babičce fotky z tábora.', 'Děda letos postavil úplně nový plot.', 'Babička jede na podzimní prázdniny ke Klárce.'], answer: 1 },
      { type: 'choice', text: 'Jakým tónem je dopis napsán?', options: ['úředním a strohým', 'vlídným a žertovným', 'vyčítavým', 'naléhavým a ustaraným'], answer: 1 },
      { type: 'choice', text: 'Proč babička píše „Ti“ a „Tě“ s velkým písmenem?', options: ['Je to chyba.', 'Vyjadřuje tím úctu a osobní vztah k adresátovi dopisu.', 'Zájmena se v češtině vždy píšou s velkým písmenem.', 'Jde o začátek věty.'], answer: 1 },
    ],
  },
  {
    group: 'recyklace', topic: 'porozumeni', grades: [7, 9],
    context: 'Plastová láhev se v přírodě rozkládá stovky let. Pokud ji ale vhodíme do žlutého kontejneru, může se z ní stát něco užitečného. Na třídicí lince se plasty rozdělí podle druhu a barvy, rozemelou se na drobné vločky a ty se vyperou. Z čistých vloček se pak vyrábějí například vlákna pro výplně bund a spacáků nebo nové obaly. Recyklace ovšem není zázrak: některé plasty se zpracovat nedají a každé přepracování materiál trochu zhorší. Odborníci se proto shodují, že nejlepší odpad je ten, který vůbec nevznikne.',
    source: 'Původní text.',
    items: [
      { type: 'choice', text: 'Které tvrzení nejlépe vystihuje hlavní myšlenku posledních dvou vět?', options: ['Recyklace řeší všechny problémy s odpadem.', 'Ještě důležitější než recyklovat je odpad nevytvářet.', 'Plasty se nedají recyklovat vůbec.', 'Žluté kontejnery jsou zbytečné.'], answer: 1 },
      { type: 'tf', text: TF, statements: ['Plastová láhev se v přírodě rozloží za několik týdnů.', 'Na lince se plasty třídí podle druhu a barvy.', 'Z recyklovaných vloček mohou vzniknout výplně bund.', 'Každým přepracováním se kvalita plastu zlepší.'], answer: [false, true, true, false] },
      { type: 'choice', text: 'Které slovo by bylo možné ve výchozím textu nahradit slovem „zázrak“ beze změny smyslu?', options: ['problém', 'samospasitelné řešení', 'odpad', 'pravidlo'], answer: 1 },
    ],
  },
  {
    group: 'mesic', topic: 'porozumeni', grades: [7, 9],
    context: 'Měsíc je jediná přirozená družice Země. Obíhá kolem ní přibližně za 27 dní a za stejnou dobu se jednou otočí kolem své osy. Proto k nám natáčí stále stejnou stranu a odvrácenou stranu Měsíce lidé poprvé spatřili až na snímcích ze sond. Měsíc nemá vlastní světlo, pouze odráží světlo Slunce. Podle toho, jak velkou část jeho osvětlené strany vidíme, rozlišujeme měsíční fáze: nov, první čtvrť, úplněk a poslední čtvrť. Měsíc také způsobuje příliv a odliv, protože jeho přitažlivost nadzvedává hladinu oceánů.',
    source: 'Původní text.',
    items: [
      { type: 'choice', text: 'Proč ze Země nikdy nevidíme odvrácenou stranu Měsíce?', options: ['Odvrácená strana je trvale zahalena mraky.', 'Měsíc se otočí kolem osy za stejnou dobu, za jakou oběhne Zemi.', 'Odvrácená strana nikdy není osvětlena Sluncem.', 'Měsíc se kolem své osy vůbec neotáčí.'], answer: 1 },
      { type: 'tf', text: TF, statements: ['Měsíc září vlastním světlem.', 'Měsíční fáze závisejí na tom, jak velkou osvětlenou část vidíme.', 'Příliv a odliv souvisí s přitažlivostí Měsíce.', 'Odvrácenou stranu Měsíce lidé znají odedávna.'], answer: [false, true, true, false] },
      { type: 'choice', text: 'Jakého slohového útvaru je výchozí text nejspíše součástí?', options: ['pohádky', 'odborného (populárně-naučného) článku', 'osobního dopisu', 'reklamy'], answer: 1 },
    ],
  },
  {
    group: 'telefon', topic: 'porozumeni', grades: [9, 9],
    context: 'Kolikrát denně se podíváme do telefonu? Výzkumy uvádějí čísla, která vypadají jako překlep. Telefon nám přitom opravdu pomáhá: najdeme v něm cestu, rozvrh, zprávy od kamarádů i slovník. Potíž nastává, když nás ovládá víc, než my ovládáme jeho. Každé pípnutí přeruší soustředění a vrátit se k rozdělané práci trvá déle, než si myslíme. Možná nejde o to telefon zakázat, ale naučit se ho odkládat. Zkusme si někdy dát hodinu bez obrazovky. Kdo ví, třeba zjistíme, že svět mimo displej je zajímavější, než jsme čekali.',
    source: 'Původní text.',
    items: [
      { type: 'choice', text: 'Který slohový útvar výchozí text nejlépe představuje?', options: ['zpráva', 'úvaha', 'popis pracovního postupu', 'vypravování'], answer: 1 },
      { type: 'choice', text: 'Jaký je postoj autora k mobilním telefonům?', options: ['Telefony by se měly úplně zakázat.', 'Telefony jsou užitečné, ale je třeba je umět odkládat.', 'Telefony nemají žádné výhody.', 'Na čase stráveném u telefonu nezáleží.'], answer: 1 },
      { type: 'choice', text: 'Co autor myslí slovy „čísla, která vypadají jako překlep“?', options: ['Výzkumy obsahují chyby.', 'Čísla jsou tak vysoká, že jsou až neuvěřitelná.', 'Čísla jsou zapsána nečitelně.', 'Výzkumy se navzájem liší.'], answer: 1 },
    ],
  },
  {
    group: 'basen_zima', topic: 'porozumeni', grades: [5, 7],
    context: 'Sníh padá potichu,\nna střechy a na plot,\nsýkorka na větvi\nnatřásá si kabát.\n\nZa oknem kočka\nsleduje vločky,\ntlapkou je honí\nna skle jak hvězdičky.',
    source: 'Původní text.',
    items: [
      { type: 'choice', text: 'Kolik veršů má výchozí text?', options: ['dva', 'čtyři', 'osm', 'deset'], answer: 2 },
      { type: 'choice', text: 'Co dělá ve výchozím textu kočka?', options: ['Honí ptáky na zahradě.', 'Tlapkou honí vločky na skle.', 'Spí u kamen.', 'Leží na střeše.'], answer: 1 },
      { type: 'choice', text: 'Ve kterém verši se nachází přirovnání?', options: ['Sníh padá potichu,', 'sleduje vločky,', 'na skle jak hvězdičky.', 'na střechy a na plot,'], answer: 2 },
    ],
  },
  {
    group: 'scena', topic: 'porozumeni', grades: [9, 9],
    context: 'MATKA (u okna): Zase prší. Na výlet můžeme zapomenout.\nPETR (s batohem na zádech): Mami, předpověď říkala, že odpoledne přestane.\nMATKA: Předpověď říkala i minulou sobotu, že bude hezky. Pamatuješ, jak jsme zmokli?\nPETR (sedne si na schod, potichu): Tak aspoň zahrajeme hru.\nMATKA (otočí se, chvíli se dívá na batoh, pak se usměje): Víš co? Vezmi pláštěnky.',
    source: 'Původní text.',
    items: [
      { type: 'choice', text: 'Ke kterému literárnímu druhu výchozí text patří?', options: ['lyrika', 'epika', 'drama', 'odborný styl'], answer: 2, explain: 'Text tvoří repliky postav a scénické poznámky.' },
      { type: 'choice', text: 'Jak se nazývají údaje v závorkách, např. „(u okna)“?', options: ['scénické poznámky', 'verše', 'nadpisy', 'citáty'], answer: 0 },
      { type: 'choice', text: 'Co nejspíše vyjadřuje poslední replika matky?', options: ['Výlet ruší.', 'Rozhodla se, že na výlet přece jen půjdou.', 'Posílá Petra samotného.', 'Chce, aby Petr uklidil batoh.'], answer: 1 },
    ],
  },

  // ================================================================ pravopis
  { topic: 'pravopis', grades: [5, 9], type: 'choice', text: 'Ve které větě je chyba v psaní i/y?', options: ['Lyžaři sjížděli z kopce.', 'Myši se schovaly ve mlýně.', 'Na poli rostly vysoké slunečnice.', 'Kocouři mlsaly smetanu.'], answer: 3, explain: 'Kocouři (rod mužský životný) mlsali.' },
  { topic: 'pravopis', grades: [5, 9], type: 'choice', text: 'Ve které možnosti je správně doplněno: „Kluci se b_li, protože pes za plotem b_l obrovský.“', options: ['á – y', 'á – i', 'y – y', 'y – i'], answer: 0, explain: 'báli se (bát se); byl (být) → y.' },
  { topic: 'pravopis', grades: [5, 7], type: 'choice', text: 'Které slovo je vyjmenované nebo příbuzné s vyjmenovaným slovem?', options: ['bidlo', 'pilník', 'pytel', 'list'], answer: 2, explain: 'pytel patří mezi vyjmenovaná slova po p.' },
  { topic: 'pravopis', grades: [5, 9], type: 'choice', text: 'Ve které větě jsou správně napsána velká písmena?', options: ['V létě pojedeme k Baltskému moři.', 'V létě pojedeme k baltskému Moři.', 'V Létě pojedeme k Baltskému moři.', 'v létě pojedeme k baltskému moři.'], answer: 0 },
  { topic: 'pravopis', grades: [5, 9], type: 'choice', text: 'Ve které větě je správně zapsáno spojení s/z?', options: ['Spadl zestřechy.', 'Spadl se střechy.', 'Spadl ze střechy.', 'Spadl sestřechy.'], answer: 2 },
  { topic: 'pravopis', grades: [7, 9], type: 'choice', text: 'Ve které možnosti jsou všechna slova napsána správně?', options: ['oběd, objem, oběť', 'objed, objem, oběť', 'oběd, oběm, oběť', 'oběd, objem, objeť'], answer: 0 },
  { topic: 'pravopis', grades: [7, 9], type: 'choice', text: 'Ve které větě je správně zapsána shoda přísudku s podmětem?', options: ['Ženy a muži pracovaly na poli.', 'Ženy a muži pracovali na poli.', 'Ženy a muži pracovala na poli.', 'Ženy a muži pracovaly na poly.'], answer: 1, explain: 'Je-li v několikanásobném podmětu rod mužský životný, píšeme -i.' },
  { topic: 'pravopis', grades: [7, 9], type: 'text', context: 'V pondělí jsme se třídou vyrazili na hory. Kluci nesli stany a holky si vzaly na starost vaření. Cestou jsme potkali stádo krav, které se pásly u potoka. Večer jsme seděli u ohně a vyprávěli si strašidelné příběhy, až se nejmenší kluci bály jít spát.', text: 'Najděte ve výchozím textu slovo, které je zapsáno s pravopisnou chybou, a napište ho pravopisně správně.', answer: ['báli'], explain: 'kluci (rod mužský životný) → báli.' },
  { topic: 'pravopis', grades: [5, 7], type: 'text', context: 'Ve škole jsme měli besedu s hasiči. Ukázali nám, jak se používá hasicí přístroj, a vyprávěli o tom, jak zachraňovali kočku ze střechy. Na konec jsme si všichni mohli sednout do hasičského auta.', text: 'Najděte ve výchozím textu slovo, které je zapsáno s pravopisnou chybou, a napište ho pravopisně správně.', answer: ['nakonec'], explain: 'Příslovce „nakonec“ (= na závěr) se píše dohromady.' },
  { topic: 'pravopis', grades: [9, 9], type: 'choice', text: 'Ve které větě je správně napsáno „mně/mě“?', options: ['Dej mě tu knihu.', 'Bez mně to nepůjde.', 'Pozval mně na oslavu.', 'Ke mně přišel pes.'], answer: 3, explain: 'Tvar 3. a 6. pádu je „mně“ (ke mně = 3. pád).' },
  { topic: 'pravopis', grades: [9, 9], type: 'choice', text: 'Ve které větě je správně napsána interpunkce?', options: ['Jan, můj nejlepší kamarád přijde zítra.', 'Jan, můj nejlepší kamarád, přijde zítra.', 'Jan můj nejlepší kamarád, přijde zítra.', 'Jan můj, nejlepší kamarád přijde zítra.'], answer: 1, explain: 'Volný přístavek se odděluje čárkami z obou stran.' },

  // ================================================================ tvarosloví
  { topic: 'tvaroslovi', grades: [5, 9], type: 'choice', text: 'Ve kterém pádě je podstatné jméno ve spojení „jdu k babičce“?', options: ['2. pád', '3. pád', '4. pád', '6. pád'], answer: 1, explain: 'ke komu, k čemu → 3. pád' },
  { topic: 'tvaroslovi', grades: [5, 9], type: 'choice', text: 'Ve kterém pádě je podstatné jméno ve spojení „píšu perem“?', options: ['4. pád', '5. pád', '6. pád', '7. pád'], answer: 3, explain: 's kým, čím → 7. pád' },
  { topic: 'tvaroslovi', grades: [5, 7], type: 'choice', text: 'Ve které větě je podstatné jméno v 5. pádě?', options: ['Petře, pojď sem!', 'Vidím Petra.', 'Mluvím o Petrovi.', 'Petr spí.'], answer: 0, explain: '5. pád = oslovení.' },
  { topic: 'tvaroslovi', grades: [5, 9], type: 'choice', text: 'Které sloveso je v rozkazovacím způsobu?', options: ['čteš', 'četl by', 'čti', 'čtu'], answer: 2 },
  { topic: 'tvaroslovi', grades: [7, 9], type: 'choice', text: 'Ve které větě je slovo „ráno“ příslovcem?', options: ['Ráno bylo chladné.', 'Vstávám ráno v šest.', 'Celé ráno pršelo.', 'Na to ráno nezapomenu.'], answer: 1, explain: 'kdy vstávám? → ráno (příslovce času).' },
  { topic: 'tvaroslovi', grades: [7, 9], type: 'choice', text: 'Které zájmeno je přivlastňovací?', options: ['někdo', 'tento', 'náš', 'kdo'], answer: 2 },
  { topic: 'tvaroslovi', grades: [9, 9], type: 'choice', text: 'Které sloveso je dokonavé?', options: ['psát', 'napsat', 'psávat', 'čtou'], answer: 1 },
  { topic: 'tvaroslovi', grades: [9, 9], type: 'choice', text: 'Ve které větě je číslovka řadová?', options: ['Mám tři bratry.', 'Byl jsem tam dvakrát.', 'Bydlím ve čtvrtém patře.', 'Koupil jsem dvojí rukavice.'], answer: 2 },

  // ================================================================ skladba
  { topic: 'skladba', grades: [5, 9], type: 'choice', text: 'Které slovo je podmětem ve větě „Na zahradě kvetou žluté narcisy.“?', options: ['zahradě', 'kvetou', 'žluté', 'narcisy'], answer: 3 },
  { topic: 'skladba', grades: [5, 9], type: 'choice', text: 'Která z následujících vět je jednoduchá?', options: ['Prší a fouká vítr.', 'Když prší, zůstáváme doma.', 'Celé odpoledne jsme si hráli v pokoji.', 'Vím, že přijdeš.'], answer: 2, explain: 'Obsahuje jediné určité sloveso (jsme si hráli).' },
  { topic: 'skladba', grades: [7, 9], type: 'choice', text: 'Ve které větě je předmět?', options: ['Pes spí.', 'Maminka čte knihu.', 'Venku je zima.', 'Ptáci odletěli.'], answer: 1, explain: 'čte co? → knihu (předmět).' },
  { topic: 'skladba', grades: [7, 9], type: 'choice', text: 'Jaký větný člen je slovo „rychle“ ve větě „Kůň běžel rychle.“?', options: ['podmět', 'přísudek', 'příslovečné určení způsobu', 'přívlastek'], answer: 2 },
  { topic: 'skladba', grades: [9, 9], type: 'choice', text: 'Jaký je vztah mezi větami v souvětí „Byl unavený, a proto šel brzy spát.“?', options: ['slučovací', 'odporovací', 'důsledkový', 'vylučovací'], answer: 2 },
  { topic: 'skladba', grades: [9, 9], type: 'choice', text: 'Jaký druh vedlejší věty je v souvětí „Kdo nepracuje, ať nejí.“?', options: ['podmětná', 'předmětná', 'přívlastková', 'příslovečná časová'], answer: 0, explain: 'Kdo ať nejí? → podmětná.' },
  { topic: 'skladba', grades: [5, 7], type: 'choice', text: 'Ve které větě je přísudek jmenný se sponou?', options: ['Tomáš je kapitán týmu.', 'Tomáš hraje fotbal.', 'Tomáš běží.', 'Tomáš kope do míče.'], answer: 0 },

  // ================================================================ slovní zásoba
  { topic: 'slovni_zasoba', grades: [5, 9], type: 'choice', text: 'Co znamená rčení „mít zlaté ruce“?', options: ['být bohatý', 'být velmi šikovný', 'nosit prsteny', 'být lakomý'], answer: 1 },
  { topic: 'slovni_zasoba', grades: [5, 9], type: 'choice', text: 'Co znamená rčení „dělat z komára velblouda“?', options: ['přehánět, zveličovat', 'rychle pracovat', 'bát se hmyzu', 'cestovat do pouště'], answer: 0 },
  { topic: 'slovni_zasoba', grades: [5, 9], type: 'choice', text: 'Co znamená rčení „mít něco za lubem“?', options: ['něco tajně chystat', 'mít hlad', 'něco ztratit', 'mít dobrou náladu'], answer: 0 },
  { topic: 'slovni_zasoba', grades: [7, 9], type: 'choice', text: 'Které slovo vzniklo skládáním?', options: ['domeček', 'vodopád', 'přeskočit', 'učitel'], answer: 1, explain: 'voda + padat → vodopád.' },
  { topic: 'slovni_zasoba', grades: [7, 9], type: 'choice', text: 'Které slovo je podřazené slovu „nábytek“?', options: ['dům', 'židle', 'pokoj', 'dřevo'], answer: 1 },
  { topic: 'slovni_zasoba', grades: [9, 9], type: 'choice', text: 'Které slovo je zkratkové slovo?', options: ['ČR', 'ČEZ', 'např.', 'tzv.'], answer: 1, explain: 'ČEZ se vyslovuje jako jedno slovo [čez].' },
  { topic: 'slovni_zasoba', grades: [9, 9], type: 'choice', text: 'Které slovo je homonymum (stejně znějící slovo s nesouvisejícími významy)?', options: ['pila', 'stůl', 'běhat', 'zelený'], answer: 0, explain: 'pila = nástroj na řezání i tvar slovesa pít (ona pila).' },

  // ================================================================ sloh a komunikace
  { topic: 'sloh', grades: [5, 9], type: 'choice', text: 'Který text je vypravování?', options: ['Krabice je hnědá a má rozměry 30 × 20 cm.', 'Včera večer zaklepal na dveře neznámý muž a podal nám obálku.', 'Nejprve nasypte mouku do mísy.', 'Prodám kolo, téměř nové, cena dohodou.'], answer: 1 },
  { topic: 'sloh', grades: [5, 9], type: 'choice', text: 'Která věta je nejvhodnější do omluvenky pro paní učitelku?', options: ['Čau, Petr nepřišel, protože byl nemocnej.', 'Omlouvám nepřítomnost syna Petra ve škole dne 3. 10. z důvodu nemoci.', 'Petr fakt nemohl.', 'Petr byl doma, tak to nějak vyřešte.'], answer: 1 },
  { topic: 'sloh', grades: [7, 9], type: 'choice', text: 'Seřaďte části pracovního postupu: (A) Hotový čaj sceďte. (B) Do konvice dejte lžičku sypaného čaje. (C) Nechte čaj 3 minuty louhovat. (D) Zalijte čaj horkou vodou.', options: ['B – D – C – A', 'D – B – C – A', 'B – C – D – A', 'A – B – D – C'], answer: 0 },
  { topic: 'sloh', grades: [7, 9], type: 'choice', text: 'Který z textů patří do publicistického stylu?', options: ['zpráva v novinách', 'osobní dopis kamarádovi', 'zákon', 'báseň'], answer: 0 },
  { topic: 'sloh', grades: [9, 9], type: 'choice', text: 'Které slovo je nespisovné?', options: ['polévka', 'mlíko', 'okno', 'hezký'], answer: 1, explain: 'spisovně: mléko' },
  { topic: 'sloh', grades: [9, 9], type: 'choice', text: 'Která věta obsahuje řečnickou otázku?', options: ['Kolik je hodin?', 'Kdo by nechtěl mít prázdniny celý rok?', 'Půjdeš se mnou?', 'Kde jsi byl?'], answer: 1 },

  // ================================================================ literatura
  { topic: 'literatura', grades: [7, 9], type: 'choice', text: 'Který literární druh zahrnuje básně vyjadřující city a nálady bez výrazného děje?', options: ['epika', 'lyrika', 'drama', 'publicistika'], answer: 1 },
  { topic: 'literatura', grades: [7, 9], type: 'choice', text: 'Jak se nazývá shoda zvukově stejných nebo podobných slabik na konci veršů?', options: ['rým', 'sloka', 'rytmus', 'přirovnání'], answer: 0 },
  { topic: 'literatura', grades: [7, 9], type: 'choice', text: 'Jak se nazývá nadsázka, například „Říkal jsem ti to už stokrát!“?', options: ['hyperbola', 'metafora', 'personifikace', 'ironie'], answer: 0 },
  { topic: 'literatura', grades: [9, 9], type: 'choice', text: 'Jak se nazývá vyjádření opaku toho, co se myslí, např. „No to se ti zase povedlo!“ po nehodě?', options: ['ironie', 'přirovnání', 'epiteton', 'anafora'], answer: 0 },
  { topic: 'literatura', grades: [9, 9], type: 'choice', text: 'Který útvar NEPATŘÍ k epice?', options: ['povídka', 'román', 'pověst', 'komedie'], answer: 3, explain: 'Komedie je dramatický útvar.' },
  { topic: 'literatura', grades: [9, 9], type: 'choice', text: 'Jak se nazývá opakování stejného slova na začátku po sobě jdoucích veršů?', options: ['anafora', 'epifora', 'rým', 'refrén'], answer: 0 },
];
