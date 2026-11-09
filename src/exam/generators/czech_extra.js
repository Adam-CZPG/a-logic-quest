// Český jazyk – další ORIGINÁLNÍ úlohy (vlastní texty a vlastní znění).
// Typy úloh odpovídají formátu jednotné přijímací zkoušky (výběr A–D, ANO/NE, otevřená odpověď,
// uspořádání textu), ale žádné zadání ani text nejsou převzaty z cizích testů.

const TF = 'Rozhodněte o každém z následujících tvrzení, zda odpovídá výchozímu textu (ANO), či nikoli (NE).';
const SRC = 'Původní text.';

// ---------------------------------------------------------------- výchozí texty se skupinami úloh
export const EXTRA_READING = [
  {
    group: 'vcely', topic: 'porozumeni', grades: [5, 7], source: SRC,
    context: 'Včela medonosná žije ve velkém společenství, kterému říkáme včelstvo. V úlu může být až padesát tisíc včel, ale vajíčka klade jen jedna z nich – královna. Většinu práce obstarávají dělnice: staví plástve z vosku, krmí larvy, hlídají vchod do úlu a létají pro nektar a pyl. Když dělnice objeví bohatý zdroj potravy, vrátí se do úlu a předvede ostatním zvláštní tanec. Podle jeho směru a rychlosti ostatní včely poznají, kterým směrem a jak daleko mají letět. Trubci, tedy samci, v úlu nepracují. Na podzim je dělnice z úlu vyženou, protože by přes zimu spotřebovali příliš mnoho zásob.',
    items: [
      { type: 'choice', text: 'Jak se podle výchozího textu ostatní včely dozvědí, kde je potrava?', options: ['Ucítí ji na dělnici.', 'Dělnice jim předvede tanec.', 'Pošle je tam královna.', 'Pamatují si to z minulého roku.'], answer: 1 },
      { type: 'tf', text: TF, statements: ['V úlu klade vajíčka jediná včela.', 'Trubci staví plástve z vosku.', 'Dělnice hlídají vchod do úlu.', 'Trubci zůstávají v úlu i přes zimu.'], answer: [true, false, true, false] },
      { type: 'choice', text: 'Které slovo z výchozího textu označuje včelího samce?', options: ['královna', 'dělnice', 'trubec', 'včelstvo'], answer: 2 },
      { type: 'text', text: 'Napište jedním slovem, z čeho podle výchozího textu stavějí dělnice plástve.', answer: ['vosk', 'z vosku', 'vosku'], explain: 'Dělnice „staví plástve z vosku“.' },
    ],
  },
  {
    group: 'kolo', topic: 'porozumeni', grades: [5, 7], source: SRC,
    context: 'Ondra dostal k narozeninám nové kolo, ale jezdit na něm neuměl. Starší sestra Klára mu slíbila, že ho to naučí. První den pořád padal a nakonec kolo naštvaně opřel o plot. „Já to nikdy nezvládnu,“ zamračil se. Klára se jen usmála: „Já jsem taky padala. Zítra to zkusíme znovu.“ Druhý den mu podržela sedlo a běžela vedle něj po celé ulici. Najednou Ondra zjistil, že ho sestra už dávno nedrží a on jede sám. Zabrzdil tak prudce, že málem spadl, ale tentokrát se smál. Večer vyprávěl tátovi, že jezdit na kole je ta nejjednodušší věc na světě.',
    items: [
      { type: 'choice', text: 'Proč Ondra první den opřel kolo o plot?', options: ['Chtěl si odpočinout.', 'Zlobil se, že se mu nedaří.', 'Kolo bylo rozbité.', 'Musel jít domů na oběd.'], answer: 1 },
      { type: 'tf', text: TF, statements: ['Kolo dostal Ondra k Vánocům.', 'Klára přiznala, že při učení také padala.', 'Druhý den držela Klára sedlo po celou dobu jízdy.', 'Ondra si nejdřív nevšiml, že jede sám.'], answer: [false, true, false, true] },
      { type: 'choice', text: 'Jak se během příběhu změnil Ondrův názor na jízdu na kole?', options: ['Nejdřív si myslel, že to nezvládne, nakonec mu to připadalo snadné.', 'Od začátku si myslel, že je to snadné.', 'Nejdřív ho to bavilo, nakonec ho to přestalo bavit.', 'Názor nezměnil a jezdit se nenaučil.'], answer: 0 },
      { type: 'choice', text: 'Které slovo je ve výchozím textu užito ve významu „rychle a silně“?', options: ['prudce', 'naštvaně', 'dávno', 'najednou'], answer: 0 },
    ],
  },
  {
    group: 'knihovna', topic: 'porozumeni', grades: [5, 9], source: SRC,
    context: 'Městská knihovna oznamuje: Od 1. března se mění otevírací doba dětského oddělení. Nově bude otevřeno v pondělí, ve středu a v pátek od 12 do 18 hodin. V úterý a ve čtvrtek bude oddělení zavřeno kvůli besedám pro školy. Knihy můžete i nadále vracet do schránky u hlavního vchodu, a to kdykoli. Čtenáři, kteří vrátí knihy pozdě, zaplatí 5 Kč za každý den zpoždění. Děti do 15 let mají registraci zdarma. Na všechny se těšíme!',
    items: [
      { type: 'choice', text: 'Ve které dny bude dětské oddělení podle oznámení otevřeno?', options: ['v pondělí, ve středu a v pátek', 'v úterý a ve čtvrtek', 'každý všední den', 'jen v pátek'], answer: 0 },
      { type: 'tf', text: TF, statements: ['Knihy lze vrátit i v době, kdy je dětské oddělení zavřené.', 'V úterý jsou v dětském oddělení besedy pro školy.', 'Registrace je zdarma pro všechny čtenáře.', 'Za celý týden zpoždění zaplatí čtenář 5 Kč.'], answer: [true, true, false, false] },
      { type: 'choice', text: 'Kolik korun zaplatí čtenář, který vrátí knihu o tři dny později?', options: ['5 Kč', '10 Kč', '15 Kč', '20 Kč'], answer: 2, explain: '3 dny × 5 Kč = 15 Kč' },
      { type: 'choice', text: 'Jaký je hlavní účel výchozího textu?', options: ['pobavit čtenáře', 'informovat o změně', 'popsat budovu knihovny', 'vyprávět příběh'], answer: 1 },
    ],
  },
  {
    group: 'jezek', topic: 'porozumeni', grades: [5, 7], source: SRC,
    context: 'Ježek je noční živočich. Přes den spí v hromadě listí nebo pod keřem a za potravou vychází až za soumraku. Živí se hlavně hmyzem, slimáky a žížalami, a proto je na zahradě vítaným pomocníkem. Mléko mu nedávejte, protože mu může způsobit vážné zažívací potíže. Když ježkovi hrozí nebezpečí, stočí se do klubíčka a naježí bodliny. Na zimu si najde chráněné místo a upadne do zimního spánku, který trvá zhruba od listopadu do března. Během něj se mu zpomalí dech i tep srdce a ježek žije z tukových zásob, které si nashromáždil na podzim.',
    items: [
      { type: 'choice', text: 'Proč by se ježkům podle výchozího textu nemělo dávat mléko?', options: ['Nechutná jim.', 'Mohou z něj mít zažívací potíže.', 'Příliš z něj ztloustnou.', 'Nemohou pak usnout.'], answer: 1 },
      { type: 'tf', text: TF, statements: ['Za potravou vychází ježek hlavně ve dne.', 'Ježek pomáhá zahradníkům, protože jí slimáky.', 'Zimní spánek trvá přibližně od listopadu do března.', 'Během zimního spánku ježek často vychází hledat potravu.'], answer: [false, true, true, false] },
      { type: 'choice', text: 'Co znamená ve výchozím textu, že ježek „naježí bodliny“?', options: ['schová je', 'vztyčí je', 'ztratí je', 'očistí je'], answer: 1 },
      { type: 'text', text: 'Napište, z čeho ježek podle výchozího textu žije během zimního spánku.', answer: ['z tukových zásob', 'tukové zásoby', 'z tuku', 'tuk', 'ze zásob tuku', 'z tukových zásob, které si nashromáždil na podzim'] },
    ],
  },
  {
    group: 'bobik', topic: 'porozumeni', grades: [5, 9], source: SRC,
    context: 'Když se Eliška vrátila ze školy, pes Bobík jí nevyběhl naproti jako obvykle. Branka na zahradu byla pootevřená. Eliška hned pochopila, co se stalo. Obešla celou ulici a ptala se sousedů, jestli Bobíka neviděli. Paní Novotná si vzpomněla, že kolem poledne viděla malého hnědého psa běžet k rybníku. Eliška se tam rozběhla. U rybníka seděl Bobík a zaujatě pozoroval kachny. Když uslyšel své jméno, provinile sklopil uši a přiběhl k ní. „Ty jeden tuláku,“ řekla Eliška a pevně ho objala. Doma pak na branku přidělala nový háček, aby se to už neopakovalo.',
    items: [
      { type: 'choice', text: 'Podle čeho Eliška poznala, že Bobík utekl?', options: ['Sousedka jí zavolala.', 'Pes jí nevyběhl naproti a branka byla pootevřená.', 'Uslyšela štěkot od rybníka.', 'Našla na ulici jeho obojek.'], answer: 1 },
      { type: 'tf', text: TF, statements: ['Paní Novotná viděla psa běžet k rybníku.', 'Eliška hledala psa společně s tátou.', 'Bobík u rybníka pozoroval kachny.', 'Eliška Bobíka za útěk potrestala.'], answer: [true, false, true, false] },
      { type: 'choice', text: 'Proč Eliška přidělala na branku nový háček?', options: ['Starý se rozbil.', 'Aby pes znovu neutekl.', 'Chtěla potěšit sousedy.', 'Branka nešla otevřít.'], answer: 1 },
      { type: 'choice', text: 'Které slovo z výchozího textu je podstatné jméno?', options: ['pootevřená', 'zaujatě', 'tuláku', 'přiběhl'], answer: 2 },
    ],
  },
  {
    group: 'lodka', topic: 'porozumeni', grades: [5, 7], source: SRC,
    context: 'Jak složit papírovou loďku: Nejprve si připravte obdélníkový papír a přeložte ho napůl podél delší strany. Horní rohy ohněte do středu tak, aby vznikl trojúhelník. Spodní pruhy papíru ohněte nahoru, jeden dopředu a druhý dozadu. Vzniklý tvar chyťte uprostřed a stlačte k sobě, až z něj bude čtverec. Spodní rohy čtverce opět ohněte nahoru na obě strany, takže vznikne menší trojúhelník. Nakonec opatrně roztáhněte horní cípy do stran – a loďka je hotová. Pokud ji chcete pustit na vodu, natřete ji zespodu voskovkou, aby tak rychle nenasákla.',
    items: [
      { type: 'choice', text: 'Co je podle výchozího textu prvním krokem?', options: ['ohnout horní rohy do středu', 'přeložit papír napůl podél delší strany', 'natřít papír voskovkou', 'stlačit tvar do čtverce'], answer: 1 },
      { type: 'choice', text: 'Proč se podle návodu loďka natírá voskovkou?', options: ['aby byla barevná', 'aby tak rychle nenasákla vodou', 'aby lépe držela tvar ve skříni', 'aby se dala znovu rozložit'], answer: 1 },
      { type: 'tf', text: TF, statements: ['K výrobě loďky jsou potřeba nůžky.', 'Na začátku se papír překládá podél delší strany.', 'Na konci se horní cípy roztahují do stran.', 'Návod doporučuje použít čtvercový papír.'], answer: [false, true, true, false] },
      { type: 'choice', text: 'O jaký slohový útvar jde ve výchozím textu?', options: ['vypravování', 'návod', 'dopis', 'báseň'], answer: 1 },
    ],
  },
  {
    group: 'voda', topic: 'porozumeni', grades: [7, 9], source: SRC,
    context: 'Průměrný obyvatel Česka spotřebuje doma asi 90 litrů pitné vody denně. Nejvíce jí proteče sprchou a záchodem, na pití a vaření připadají jen asi tři litry. Úspora přitom nemusí být složitá. Pětiminutová sprcha místo koupele ušetří i sto litrů. Kapající kohoutek dokáže za rok promrhat několik tisíc litrů, a proto se vyplatí ho včas opravit. Plně naložená myčka spotřebuje často méně vody než mytí nádobí pod tekoucí vodou. Odborníci připomínají, že pitné vody sice v Česku zatím máme dost, ale suchá léta ukazují, že s ní nemůžeme zacházet bezstarostně.',
    items: [
      { type: 'choice', text: 'Na co se podle výchozího textu v domácnosti spotřebuje nejvíce pitné vody?', options: ['na pití a vaření', 'na mytí nádobí', 'na sprchování a splachování záchodu', 'na zalévání zahrady'], answer: 2 },
      { type: 'tf', text: TF, statements: ['Na pití a vaření připadá asi třetina denní spotřeby.', 'Kapající kohoutek může za rok promrhat tisíce litrů vody.', 'Plně naložená myčka spotřebuje vždy více vody než mytí v dřezu.', 'Podle textu je dnes v Česku pitné vody nedostatek.'], answer: [false, true, false, false] },
      { type: 'choice', text: 'Které z následujících tvrzení nejlépe vystihuje záměr výchozího textu?', options: ['přesvědčit čtenáře, aby vodou šetřil', 'popsat, jak se vyrábí pitná voda', 'porovnat spotřebu vody v různých zemích', 'vysvětlit, proč jsou léta suchá'], answer: 0 },
      { type: 'choice', text: 'Které slovo je ve výchozím textu užito ve významu „bez obav, nerozvážně“?', options: ['bezstarostně', 'složitá', 'včas', 'průměrný'], answer: 0 },
    ],
  },
  {
    group: 'radio', topic: 'porozumeni', grades: [7, 9], source: SRC,
    context: 'Děda měl na kuchyňské lince staré rádio, které uměl naladit jen on. Kdykoli jsem na něj sáhl, ozvalo se jen chrčení. „Musíš mít trpělivost,“ říkal děda a otáčel knoflíkem tak pomalu, že jsem se nudil už při pohledu na něj. Když jsem byl malý, myslel jsem si, že rádio poslouchá jenom jeho. Teprve mnohem později jsem pochopil, že to nebylo kouzlo, ale zkušenost, kterou získal za desítky let. Rádio dnes stojí u mě v pokoji. Občas ho zapnu a otáčím knoflíkem, dokud se z chrčení nevynoří hlas. Pokaždé mám pocit, že děda stojí za mnou a spokojeně přikyvuje.',
    items: [
      { type: 'choice', text: 'Kdo je vypravěčem výchozího textu?', options: ['děda', 'dědův vnuk', 'nezúčastněný pozorovatel', 'prodavač rádií'], answer: 1 },
      { type: 'tf', text: TF, statements: ['Vypravěč si jako malý myslel, že rádio poslouchá jen dědu.', 'Děda otáčel knoflíkem velmi rychle.', 'Rádio dnes stojí v dědově kuchyni.', 'Při ladění rádia si vypravěč vzpomene na dědu.'], answer: [true, false, false, true] },
      { type: 'choice', text: 'Co podle vypravěče umožňovalo dědovi rádio naladit?', options: ['kouzlo', 'zkušenost', 'nový knoflík', 'lepší anténa'], answer: 1 },
      { type: 'choice', text: 'Jakou náladu má závěr výchozího textu?', options: ['vzpomínkovou a láskyplnou', 'posměšnou', 'napínavou a strašidelnou', 'rozzlobenou'], answer: 0 },
    ],
  },
  {
    group: 'mobily', topic: 'porozumeni', grades: [7, 9], source: SRC,
    context: 'Na naší škole se už několik týdnů vede spor o mobilní telefony. Vedení navrhuje, aby žáci odkládali telefony ráno do skříněk a vyzvedli si je až po vyučování. Zastánci zákazu tvrdí, že se děti budou lépe soustředit a o přestávkách spolu budou víc mluvit. Odpůrci namítají, že telefon je užitečný pomocník, například když je potřeba rychle něco vyhledat nebo se domluvit s rodiči. Někteří učitelé navrhují kompromis: telefony by zůstaly v taškách a vytahovat by se směly jen s dovolením. O konečném řešení má rozhodnout školní parlament na konci měsíce.',
    items: [
      { type: 'choice', text: 'Který argument podle výchozího textu používají odpůrci zákazu?', options: ['Děti se budou lépe soustředit.', 'O přestávkách si děti víc popovídají.', 'Telefon pomáhá rychle něco vyhledat.', 'Telefony se ve skříňkách neztratí.'], answer: 2 },
      { type: 'tf', text: TF, statements: ['Vedení školy navrhuje, aby žáci odkládali telefony do skříněk.', 'O řešení už rozhodl ředitel.', 'Kompromis navrhují někteří učitelé.', 'Podle kompromisu by telefony zůstávaly doma.'], answer: [true, false, true, false] },
      { type: 'choice', text: 'Které slovo z výchozího textu má opačný význam než slovo „zastánci“?', options: ['odpůrci', 'učitelé', 'žáci', 'rodiče'], answer: 0 },
      { type: 'choice', text: 'Kdo má podle výchozího textu o řešení rozhodnout?', options: ['vedení školy', 'rodiče', 'školní parlament', 'učitelé'], answer: 2 },
    ],
  },
  {
    group: 'kurovec', topic: 'porozumeni', grades: [9, 9], source: SRC,
    context: 'Kůrovec je drobný brouk, který žije pod kůrou smrků. Za normálních okolností napadá hlavně oslabené stromy a v lese plní užitečnou roli: urychluje rozklad odumřelého dřeva. Problém nastal, když se v posledních desetiletích spojilo několik věcí najednou. Mnoho lesů tvořily jen smrky vysázené v nížinách, kde se jim nedaří, a k tomu přišla suchá a teplá léta. Oslabené stromy se nedokázaly bránit, kůrovců rychle přibývalo a během několika let zničili rozsáhlé plochy lesa. Lesníci dnes proto vysazují pestřejší lesy, v nichž rostou vedle smrků i buky, duby či jedle. Takový les je odolnější, protože jeden škůdce v něm nemůže zničit všechno.',
    items: [
      { type: 'choice', text: 'Jakou roli plní kůrovec podle výchozího textu za normálních okolností?', options: ['ničí hlavně zdravé stromy', 'urychluje rozklad odumřelého dřeva', 'opyluje květy buků', 'nemá v lese žádný význam'], answer: 1 },
      { type: 'tf', text: TF, statements: ['K rozšíření kůrovce přispěla suchá a teplá léta.', 'Smrkům se podle textu v nížinách daří lépe než jinde.', 'Lesníci dnes vysazují lesy složené z více druhů stromů.', 'Smíšený les podle textu kůrovec nemůže napadnout vůbec.'], answer: [true, false, true, false] },
      { type: 'choice', text: 'Jak výchozí text vysvětluje příčinu rozsáhlého poškození lesů?', options: ['Kůrovce do Česka zavlekli lidé z ciziny.', 'Spojilo se několik nepříznivých okolností najednou.', 'Lesníci přestali stromy kácet.', 'Kůrovec začal žít v listnatých stromech.'], answer: 1 },
      { type: 'choice', text: 'Jaký druh vedlejší věty je v souvětí „Takový les je odolnější, protože jeden škůdce v něm nemůže zničit všechno.“?', options: ['příslovečná příčinná', 'předmětná', 'přívlastková', 'příslovečná časová'], answer: 0 },
    ],
  },
  {
    group: 'mesto', topic: 'porozumeni', grades: [9, 9], source: SRC,
    context: 'Město se ráno protahuje,\nzívá do ulic šedivou mlhou,\ntramvaj si zvoní jak kos na plotě\na lampy zhasínají jednou dlouhou\n\nvlnou, jako by je někdo sfoukl.\nPekař už dávno voní chlebem,\nholub si čistí šedé peří\na nad komíny svítá nebem.',
    items: [
      { type: 'choice', text: 'Který básnický prostředek je užit ve verši „Město se ráno protahuje“?', options: ['personifikace', 'přirovnání', 'řečnická otázka', 'nadsázka'], answer: 0, explain: 'Město jedná jako člověk.' },
      { type: 'choice', text: 'Ve kterém verši výchozího textu je přirovnání?', options: ['zívá do ulic šedivou mlhou,', 'tramvaj si zvoní jak kos na plotě', 'Pekař už dávno voní chlebem,', 'holub si čistí šedé peří'], answer: 1, explain: '„jak kos na plotě“' },
      { type: 'choice', text: 'Které slovo se ve výchozím textu rýmuje se slovem „mlhou“?', options: ['dlouhou', 'vlnou', 'plotě', 'sfoukl'], answer: 0 },
      { type: 'choice', text: 'Kterou část dne výchozí text zachycuje?', options: ['ráno', 'poledne', 'večer', 'noc'], answer: 0 },
    ],
  },
  {
    group: 'pisemka', topic: 'porozumeni', grades: [7, 9], source: SRC,
    context: '„Zítra píšeme písemku z matiky a já vůbec nic neumím,“ povzdechl si Martin do telefonu. „To říkáš pokaždé,“ odpověděla Jana, „a pak máš za dvě.“ Martin se ale nedal přesvědčit. Celý večer seděl nad sešitem, ale myšlenky mu utíkaly jinam. Nakonec mu Jana poslala zprávu s nápadem: ať si zkusí vysvětlit každý příklad nahlas, jako by učil mladšího bratra. Martin si připadal hloupě, ale po chvíli zjistil, že tak přesně pozná, čemu ještě nerozumí. Druhý den odcházel z písemky s úsměvem. „Tak co?“ zeptala se Jana. „Nevím, jestli mám jedničku,“ řekl Martin, „ale poprvé jsem věděl, co dělám.“',
    items: [
      { type: 'choice', text: 'Jakou radu dala Jana Martinovi?', options: ['ať se přestane učit a jde spát', 'ať si příklady vysvětluje nahlas', 'ať si na písemku vezme tahák', 'ať se učí s mladším bratrem'], answer: 1 },
      { type: 'tf', text: TF, statements: ['Podle Jany Martin obvykle dostává špatné známky.', 'Martin si u Janiny metody nejdřív připadal hloupě.', 'Martin s jistotou ví, že dostal jedničku.', 'Díky metodě Martin poznal, čemu nerozumí.'], answer: [false, true, false, true] },
      { type: 'choice', text: 'Co znamená ve výchozím textu spojení „myšlenky mu utíkaly jinam“?', options: ['nemohl se soustředit', 'zapomněl, kde má sešit', 'rychle počítal', 'přemýšlel o matematice'], answer: 0 },
      { type: 'choice', text: 'Kolik vět obsahuje souvětí „Martin si připadal hloupě, ale po chvíli zjistil, že tak přesně pozná, čemu ještě nerozumí.“?', options: ['dvě', 'tři', 'čtyři', 'pět'], answer: 2, explain: 'připadal – zjistil – pozná – nerozumí: čtyři určitá slovesa, tedy čtyři věty.' },
    ],
  },
];

// ---------------------------------------------------------------- souvětí: čárky, počet vět, druh vedlejší věty
// [věta hlavní, spojovací výraz, druhá věta, čárka?, druh vedlejší věty nebo null (souřadné spojení), lze začít vedlejší větou?]
const CLAUSES = [
  ['Venku začalo pršet', 'a', 'děti utekly domů', false, null],
  ['Venku začalo pršet', 'ale', 'děti si dál hrály na hřišti', true, null],
  ['Táta umyl nádobí', 'a', 'máma vytřela podlahu', false, null],
  ['Uvaříme si čaj', 'nebo', 'si dáme kakao', false, null],
  ['Otevřel okno', 'a', 'pustil dovnitř čerstvý vzduch', false, null],
  ['Byla velká zima', 'takže', 'jsme si vzali čepice', true, null],
  ['Ráda čtu', 'ale', 'nejraději kreslím', true, null],
  ['Zůstali jsme doma', 'protože', 'venku pršelo', true, 'příslovečná příčinná', true],
  ['Bylo mu smutno', 'protože', 'jeho kamarád odjel', true, 'příslovečná příčinná', true],
  ['Nevím', 'jestli', 'zítra přijdeš', true, 'předmětná'],
  ['Maminka řekla', 'že', 'večeře bude v sedm', true, 'předmětná'],
  ['Zeptala se mě', 'kdy', 'začíná film', true, 'předmětná'],
  ['Zavolej mi', 'až', 'dorazíš domů', true, 'příslovečná časová', true],
  ['Půjdeme do parku', 'když', 'skončí vyučování', true, 'příslovečná časová', true],
  ['Půjčím ti kolo', 'pokud', 'ho vrátíš do večera', true, 'příslovečná podmínková', true],
  ['Šetřím peníze', 'abych', 'si mohl koupit nový míč', true, 'příslovečná účelová'],
  ['Pospíchali jsme', 'abychom', 'stihli vlak', true, 'příslovečná účelová'],
  ['Přečetl jsem knihu', 'kterou', 'mi půjčila sestra', true, 'přívlastková'],
  ['Ukázal mi místo', 'kde', 'našel starou mapu', true, 'přívlastková'],
  ['Potkali jsme paní', 'která', 'bydlí vedle školy', true, 'přívlastková'],
];

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const low = (s) => s.charAt(0).toLowerCase() + s.slice(1);

// renders a clause pair; `right` = with correct punctuation, otherwise with the comma flipped
function render(c, right, front = false) {
  const [main, conj, sub, comma] = c;
  const useComma = right ? comma : !comma;
  if (front) return `${cap(conj)} ${sub}${useComma ? ',' : ''} ${low(main)}.`;
  return `${main}${useComma ? ',' : ''} ${conj} ${sub}.`;
}

function commaWhich(r) {
  const picked = r.sample(CLAUSES, 4);
  const good = r.int(0, 3);
  const options = picked.map((c, i) => render(c, i === good, c[5] && r.chance(0.35)));
  return {
    type: 'choice', text: 'Ve kterém z následujících souvětí je správně zapsána interpunkce?', options, answer: good,
    explain: picked[good][3] ? `Před spojovacím výrazem „${picked[good][1]}“ se zde píše čárka.` : `Před spojkou „${picked[good][1]}“ v tomto souvětí čárka nepatří.`,
  };
}

function commaTF(r) {
  const picked = r.sample(CLAUSES, 4);
  const answer = picked.map(() => r.chance(0.5));
  const statements = picked.map((c, i) => render(c, answer[i], c[5] && r.chance(0.3)));
  return { type: 'tf', text: 'Rozhodněte o každém z následujících souvětí, zda je v něm interpunkce zapsána správně (ANO), či nikoli (NE).', statements, answer };
}

// one-verb sentences, two-clause pairs and a few longer ones written out by hand
const SIMPLE = ['Na stole leží nová kniha.', 'Celý den jsme pracovali na zahradě.', 'Ráno nás vzbudil hlasitý déšť.', 'Kamarádi na mě čekali před školou.', 'Po obědě budeme hrát fotbal.'];
const LONG = [
  ['Když jsme přišli domů, zjistili jsme, že někdo snědl všechny sušenky.', 3],
  ['Myslela jsem, že přijdeš, ale nakonec jsi zůstal doma, protože ti nebylo dobře.', 4],
  ['Babička vařila, děda četl noviny a my jsme si hráli.', 3],
  ['Nevěděl, kam má jít, a tak se zeptal kolemjdoucího, který vypadal přátelsky.', 4],
];
function clauseCount(r) {
  const kind = r.int(0, 2);
  let sentence; let n;
  if (kind === 0) { sentence = r.pick(SIMPLE); n = 1; } else if (kind === 1) { const c = r.pick(CLAUSES); sentence = render(c, true, c[5] && r.chance(0.4)); n = 2; } else { [sentence, n] = r.pick(LONG); }
  const names = ['jednu', 'dvě', 'tři', 'čtyři'];
  const options = names;
  return { type: 'choice', text: `Kolik vět obsahuje následující souvětí (nebo věta)? „${sentence}“`, options, answer: n - 1, explain: 'Počet vět odpovídá počtu určitých slovesných tvarů (přísudků).' };
}

const SUB_TYPES = ['předmětná', 'přívlastková', 'příslovečná časová', 'příslovečná příčinná', 'příslovečná podmínková', 'příslovečná účelová'];
function subordinateType(r, ctx) {
  if ((ctx?.grade || 9) < 7) return null; // druhy vedlejších vět až od 7. ročníku
  const c = r.pick(CLAUSES.filter((x) => x[4]));
  const sentence = render(c, true, c[5] && r.chance(0.4));
  const options = r.shuffle([c[4], ...r.sample(SUB_TYPES.filter((t) => t !== c[4]), 3)]);
  return { type: 'choice', text: `Jaký druh vedlejší věty je v souvětí „${sentence}“?`, options, answer: options.indexOf(c[4]), explain: c[4] };
}

// ---------------------------------------------------------------- mě / mně
// [věta s ___, správný tvar, pád]
const ME_MNE = [
  ['Podej ___ prosím sůl.', 'mně', 3], ['Babička ___ pozvala na oběd.', 'mě', 4], ['Bez ___ nikam nechoďte.', 'mě', 2],
  ['Řekni ___ pravdu.', 'mně', 3], ['Mluvili o ___ hezky.', 'mně', 6], ['Ke ___ si nikdo nepřisedl.', 'mně', 3],
  ['Vidíš ___ dobře?', 'mě', 4], ['Ta kniha patří ___.', 'mně', 3], ['Kamarád na ___ čekal před školou.', 'mě', 4],
  ['Zdá se ___, že bude pršet.', 'mně', 3], ['Nech ___ chvíli odpočinout.', 'mě', 4], ['U ___ doma máme dva psy.', 'mě', 2],
  ['Rodiče ___ koupili nové kolo.', 'mně', 3], ['Na ___ se nezlob.', 'mě', 4], ['Při ___ sedí nejlepší kamarádka.', 'mně', 6],
  ['Pozdravuj ___ babičku.', 'mi', null],
].filter((x) => x[2]);
function meMne(r) {
  if (r.chance(0.5)) {
    const [s, right, pad] = r.pick(ME_MNE);
    const options = ['mě', 'mně'];
    return { type: 'choice', text: `Které slovo správně doplníte do věty: „${s}“?`, options, answer: options.indexOf(right), explain: `${right} – ${pad}. pád (mně ve 3. a 6. pádě, mě ve 2. a 4. pádě)` };
  }
  const picked = r.sample(ME_MNE, 4);
  const answer = picked.map(() => r.chance(0.5));
  const statements = picked.map(([s, right], i) => s.replace('___', answer[i] ? right : right === 'mě' ? 'mně' : 'mě'));
  return { type: 'tf', text: 'Rozhodněte o každé z následujících vět, zda je zapsána pravopisně správně (ANO), či nikoli (NE).', statements, answer };
}

// ---------------------------------------------------------------- spisovnost
// [spisovně, nespisovně]
const STANDARD = [
  ['mléko', 'mlíko'], ['dobrý', 'dobrej'], ['okno', 'vokno'], ['bychom', 'bysme'], ['dělají', 'dělaj'], ['týden', 'tejden'],
  ['polévka', 'polívka'], ['mýdlo', 'mejdlo'], ['bydlet', 'bydlit'], ['malými', 'malejma'], ['otevřít', 'votevřít'], ['velký', 'velkej'],
  ['byl jsem', 'byl sem'], ['přinesl', 'přines'], ['s kamarády', 's kamarádama'],
];
function standardWord(r) {
  const [good] = r.pick(STANDARD);
  const others = r.sample(STANDARD.filter((p) => p[0] !== good), 3).map((p) => p[1]);
  const options = r.shuffle([good, ...others]);
  return { type: 'choice', text: 'Které z následujících slov (spojení) je spisovné?', options, answer: options.indexOf(good) };
}
const STANDARD_SENT = [
  ['Včera jsme byli s kamarády v kině.', ['Včera sme byli s kamarády v kině.', 'Včera jsme byli s kamarádama v kině.', 'Včera jsme byli s kamarády v kinu.']],
  ['Na stole stojí velký hrnek s mlékem.', ['Na stole stojí velkej hrnek s mlékem.', 'Na stole stojí velký hrnek s mlíkem.', 'Na stole stojí velký hrnek se mlíkem.']],
  ['Kdybychom měli čas, přišli bychom.', ['Kdybysme měli čas, přišli bysme.', 'Kdybychom měli čas, přišli bysme.', 'Kdybysme měli čas, přišli bychom.']],
  ['Děti si hrají s malými psy.', ['Děti si hrajou s malými psy.', 'Děti si hrají s malejma psy.', 'Děti si hrají s malejma psama.']],
];
function standardSentence(r) {
  const [good, bad] = r.pick(STANDARD_SENT);
  const options = r.shuffle([good, ...bad]);
  return { type: 'choice', text: 'Která z následujících vět je zapsána spisovně?', options, answer: options.indexOf(good) };
}

// ---------------------------------------------------------------- uspořádání textu
const SEQUENCES = [
  ['Tereza se rozhodla upéct bábovku.', 'Nejdřív vyndala ze spíže mouku, cukr a vajíčka.', 'Potom těsto pečlivě vymíchala a nalila do formy.', 'Za hodinu voněla bábovka po celém bytě.'],
  ['Ráno se nad horami objevily tmavé mraky.', 'Turisté proto zrychlili krok.', 'Sotva došli k chatě, spustil se liják.', 'Venku pak pršelo až do večera.'],
  ['Kuba našel na chodníku peněženku.', 'Uvnitř byla kartička se jménem a adresou.', 'Peněženku majitelce hned odnesl.', 'Paní mu z vděčnosti dala čokoládu.'],
  ['Na jaře jsme na zahradě zaseli mrkev.', 'Celé léto jsme záhon zalévali a pleli.', 'Na podzim jsme mrkev sklidili.', 'Babička z ní pak uvařila polévku.'],
  ['Třída se domluvila, že uspořádá sbírku pro útulek.', 'Každý přinesl něco, co mohou psi potřebovat.', 'V pátek jsme všechno odvezli do útulku.', 'Ošetřovatelé nám poděkovali a ukázali nám štěňata.'],
  ['Zazvonil budík.', 'Lenka se neochotně posadila na posteli.', 'Pak si všimla, že je sobota.', 'S úsměvem se zase zachumlala do peřiny.'],
];
const LET = ['A', 'B', 'C', 'D'];
function ordering(r) {
  const seq = r.pick(SEQUENCES);
  const shuffled = r.shuffle(seq.map((s, i) => [s, i]));
  // the right order as letters of the shuffled list
  const order = seq.map((_, i) => LET[shuffled.findIndex((x) => x[1] === i)]).join(' – ');
  const perms = new Set([order]);
  while (perms.size < 4) perms.add(r.shuffle(LET.slice()).join(' – '));
  const options = r.shuffle([...perms]);
  const listing = shuffled.map(([s], i) => `(${LET[i]}) ${s}`).join(' ');
  return { type: 'choice', text: `Seřaďte věty tak, aby na sebe navazovaly a tvořily souvislý text: ${listing}`, options, answer: options.indexOf(order), explain: seq.join(' ') };
}

// ---------------------------------------------------------------- předpony
const PREFIXED = {
  vy: ['vyběhnout', 'vymyslet', 'vypít', 'vyskočit'], pře: ['přeložit', 'přepsat', 'přeplavat', 'přeskočit'],
  při: ['přiběhnout', 'přinést', 'připsat', 'přiletět'], od: ['odběhnout', 'odnést', 'odletět', 'odjet'],
  pod: ['podepsat', 'podložit', 'podlézt'], nad: ['nadepsat', 'nadzvednout'], roz: ['rozbít', 'rozložit', 'rozběhnout se'],
  za: ['zapsat', 'zatlačit', 'zabouchat'], na: ['napsat', 'naložit', 'nakreslit'], ob: ['obejít', 'obléknout', 'obkreslit'],
  pro: ['proběhnout', 'prospat', 'prohrát'], do: ['dopsat', 'doběhnout', 'dojet'],
};
function prefix(r) {
  const keys = Object.keys(PREFIXED);
  const target = r.pick(keys);
  // no distractor whose prefix looks like the target (na- vs nad-, po- vs pod- …)
  const others = r.sample(keys.filter((k) => k !== target && !k.startsWith(target) && !target.startsWith(k)), 3);
  const right = r.pick(PREFIXED[target]);
  const options = r.shuffle([right, ...others.map((k) => r.pick(PREFIXED[k]))]);
  return { type: 'choice', text: `Ve kterém z následujících slov je předpona ${target}-?`, options, answer: options.indexOf(right), explain: `${right} = ${target}- + …` };
}

// ---------------------------------------------------------------- básnické prostředky (další vlastní příklady)
export const EXTRA_FIGURES = [
  ['Slunce se usmívalo na celé údolí.', 'personifikace'], ['Hodiny na věži líně odbíjely poledne.', 'personifikace'],
  ['Řeka si potichu povídala s kameny.', 'personifikace'], ['Byl rychlý jako vítr.', 'přirovnání'],
  ['Sníh ležel bílý jako cukr.', 'přirovnání'], ['Mlčel jako hrob.', 'přirovnání'],
  ['Na nebi hořelo zlaté oko dne.', 'metafora'], ['Stříbrný had řeky se vinul údolím.', 'metafora'],
];

export const EXTRA_GENERATORS = {
  pravopis: [meMne, commaTF],
  skladba: [commaWhich, commaTF, clauseCount, subordinateType],
  slovni_zasoba: [prefix],
  sloh: [standardWord, standardSentence, ordering, ordering],
};
