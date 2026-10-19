export type GameId =
  | "roulette"
  | "truth"
  | "never"
  | "higher-lower"
  | "most-likely"
  | "hot-potato"
  | "fate"
  | "live"
  | "sip-dare"
  | "bottle"
  | "box"
  | "quickfire"
  | "showdown"
  | "emoji"
  | "category-rush"
  | "truth-train"
  | "bus"
  | "spy"
  | "werewolf"
  | "bluff"
  | "liars-dice"
  | "two-truths";
export type PromptGame = "truth" | "never" | "most-likely";
export type Category = "all" | "vors" | "hytta" | "venner";
export interface GameDefinition {
  id: GameId;
  name: string;
  subtitle: string;
  description: string;
  min: number;
  max?: number;
  time: string;
  kind: "cards" | "social" | "action" | "live";
  symbol: string;
  rules: string[];
}
export const games: GameDefinition[] = [
  {
    id: "roulette",
    name: "Sip Roulette",
    subtitle: "La hjulet bestemme",
    description: "Snurr hjulet. En slurk, en utfordring eller hele gjengen?",
    min: 1,
    time: "5–10 min",
    kind: "action",
    symbol: "✳",
    rules: [
      "Spilleren som vises snurrer hjulet.",
      "Gjør det feltet sier, eller hopp over. Neste spiller tar neste spinn.",
      "Dere velger selv hva som er i glasset.",
    ],
  },
  {
    id: "truth",
    name: "Truth or Sip",
    subtitle: "Kortene på bordet",
    description: "Svar ærlig på spørsmålet. Eller la glasset svare for deg.",
    min: 2,
    time: "10–15 min",
    kind: "social",
    symbol: "?",
    rules: [
      "Send enheten til spilleren som vises.",
      "Les spørsmålet og velg «Jeg svarer» eller «Jeg tar en slurk».",
      "Svaret sier dere høyt. Hopp over er alltid et valg.",
    ],
  },
  {
    id: "never",
    name: "Never Have I Ever",
    subtitle: "Jeg har aldri …",
    description: "Én påstand. Alle som kjenner seg igjen tar en slurk.",
    min: 2,
    time: "10–15 min",
    kind: "social",
    symbol: "“",
    rules: [
      "Legg enheten så alle ser skjermen.",
      "Les «Jeg har aldri»-påstanden høyt. Alle som har gjort det tar en slurk.",
      "Trykk videre når gjengen er klar.",
    ],
  },
  {
    id: "higher-lower",
    name: "Higher or Lower",
    subtitle: "Stol på magefølelsen",
    description:
      "Blir neste kort høyere eller lavere? Ett valg. Ett nytt kort.",
    min: 1,
    time: "5–10 min",
    kind: "cards",
    symbol: "↕",
    rules: [
      "Gjett om neste kort er høyere eller lavere enn kortet på bordet.",
      "Velg rask runde eller rekkemodus. Avtal om ess er lavest eller høyest, og om like kort er trygge eller feil.",
      "Rask runde gir ett poeng for riktig svar og bytter spiller etter hvert kort.",
      "I rekkemodus fortsetter samme spiller: sikre poengene eller risiker rekken på et nytt kort. Feil mister bare usikrede poeng. En valgfri slurk ved feil.",
      "Trygge like kort beholder rekken uten ekstra poeng. Når stokken tømmes sikres en ubrutt rekke automatisk.",
      "Kortene trekkes fra én stokket kortstokk uten tilbakelegging.",
    ],
  },
  {
    id: "most-likely",
    name: "Who’s Most Likely?",
    subtitle: "Hvem av dere?",
    description: "Pek samtidig, eller send mobilen rundt og stem i skjul.",
    min: 3,
    time: "10–15 min",
    kind: "social",
    symbol: "☞",
    rules: [
      "Les spørsmålet høyt og velg peking eller hemmelig avstemming.",
      "Ved peking: Tell til tre og pek samtidig. Flest fingre tar en slurk.",
      "Ved avstemming: Send enheten rundt. Hver spiller avgir én skjult stemme.",
      "Flest stemmer tar en slurk. Ved delt førsteplass deler dere resultatet.",
    ],
  },
  {
    id: "hot-potato",
    name: "Hot Potato",
    subtitle: "Ikke sitt igjen med den",
    description: "Send mobilen videre. Ingen vet når poteten går av.",
    min: 2,
    time: "5–10 min",
    kind: "action",
    symbol: "◉",
    rules: [
      "Første spiller holder enheten og starter den skjulte tidtakeren.",
      "Gi mobilen til navnet som vises og trykk «Send videre».",
      "Når tiden går ut får den som står på skjermen en slurk eller en oppgave.",
      "Det er ingen pause midt i runden. Bytt fane og kom tilbake: klokken går fortsatt.",
    ],
  },
  {
    id: "fate",
    name: "Card of Fate",
    subtitle: "Ett kort. En ny regel.",
    description: "En digital kortstokk med en skjebne for hvert kort.",
    min: 2,
    time: "15–25 min",
    kind: "cards",
    symbol: "♠",
    rules: [
      "Trekk ett kort på din tur og følg regelen som vises.",
      "Ess: alle tar en slurk. 2: velg noen. 3: ta en slurk selv.",
      "4: siste hånd på bordet. 5: kategori. 6: rim. 7: siste hånd i været. 8: velg en makker.",
      "Makkerpar vises på skjermen. Hver spiller har én makker; et nytt valg erstatter begge tidligere par. Ingen slurk utløser en kjede.",
      "9: «Jeg har aldri». 10: felles miniregel. Knekt: tommelmester. Dame: spørsmålsmester.",
      "Konge: finn på en husregel som gjelder videre. Skriv den inn hvis dere vil.",
      "Fjerde konge avslutter spillet. Her brukes ingen felles kopp.",
    ],
  },
  {
    id: "live",
    name: "SipZone Live",
    subtitle: "Hver deres skjerm",
    description:
      "Hver sin mobil, samme spill. Femten leker: kort, quiz, roller, potet, hjul og mer.",
    min: 2,
    time: "Så lenge dere vil",
    kind: "live",
    symbol: "↗",
    rules: [
      "Logg inn med SpillArena-kontoen din og opprett eller bli med i et rom.",
      "Del koden eller invitasjonslenken. Rommet har plass til 16 spillere.",
      "Verten velger blant ni leker: Who’s Most Likely?, Higher or Lower, Emoji Decoder, Quickfire, Hot Potato, Sip Roulette, Sip or Dare, Truth or Sip og Jeg har aldri.",
      "Alle ser samme runde samtidig. Stemmer og svar er private frem til resultatet vises, og quizene gir poeng.",
      "Verten viser resultatet og starter neste runde. Rommet utløper etter 24 timer.",
    ],
  },
  {
    id: "sip-dare",
    name: "Sip or Dare",
    subtitle: "Litt mot i glasset",
    description:
      "Ta en slurk, eller gi gjengen et lite show. Velg deres eget nivå.",
    min: 2,
    time: "10–15 min",
    kind: "social",
    symbol: "!",
    rules: [
      "Send enheten til spilleren som vises. Velg slurk eller en skjult utfordring.",
      "Velg rolig eller modig nivå og kategori før start. Modig betyr mer improvisasjon.",
      "Gjennomfør, ta én valgfri slurk eller hopp over. Ingen må gjøre en utfordring.",
      "Oppgavene gjentas ikke i økten. En liten kategori kan gi færre runder.",
    ],
  },
  {
    id: "bottle",
    name: "Spin the Bottle",
    subtitle: "Hvem peker den på?",
    description:
      "Snurr flasken. Den som blir valgt får et spørsmål eller en utfordring.",
    min: 2,
    time: "5–15 min",
    kind: "action",
    symbol: "↻",
    rules: [
      "Legg enheten midt på bordet. Navnene rundt flasken viser spillerplassene.",
      "Snurr flasken. Alle spillere har samme sjanse, også den som ble valgt sist.",
      "Den flasken peker på velger spørsmål eller utfordring. Svar og oppgaver sies høyt.",
      "Fullfør, velg en valgfri slurk eller hopp over før neste spinn.",
    ],
  },
  {
    id: "box",
    name: "The Snus Box",
    subtitle: "Send boksen, skap historier",
    description:
      "En virtuell snusboks. Send den rundt, åpne lokket og se hva som venter.",
    min: 2,
    time: "5–10 min",
    kind: "action",
    symbol: "◉",
    rules: [
      "Send mobilen til spilleren som vises. Boksen er digital; dere trenger ingen fysisk boks.",
      "Holderen kan åpne boksen eller sende den til neste spiller. Trykk først når mobilen er overlevert.",
      "Ved åpning vises en tilfeldig oppgave uten gjentakelser. Gjør den eller hopp over.",
      "Lukk boksen etter oppgaven. Neste spiller starter neste runde.",
    ],
  },
  {
    id: "quickfire",
    name: "Quickfire Questions",
    subtitle: "Tenk kjapt. Trykk kjappere.",
    description: "Fire svar. Én tidsfrist. Hvor lang serie klarer du?",
    min: 1,
    time: "5–10 min",
    kind: "action",
    symbol: "ϟ",
    rules: [
      "Gi enheten til spilleren som vises. Trykk start når spilleren er klar.",
      "Velg ett av fire svar før tiden løper ut. Første trykk er endelig.",
      "Riktig gir ett poeng og øker din personlige serie. Feil eller tidsslutt nullstiller serien og gir én valgfri slurk.",
      "Klokken fortsetter ved fanebytte. Spørsmålene gjentas ikke i samme økt.",
    ],
  },
  {
    id: "showdown",
    name: "Sip Showdown",
    subtitle: "To inn. Én videre.",
    description:
      "Små dueller, store seiersglis. Hvem vinner gjengens turnering?",
    min: 2,
    time: "10–20 min",
    kind: "action",
    symbol: "VS",
    rules: [
      "Spillerne trekkes tilfeldig til en utslagsturnering. Hver duell har en felles oppgave.",
      "Gjengen avgjør og trykker på vinneren. Taperen kan ta én valgfri slurk.",
      "Uavgjort eller hopp over gir en ny oppgave med de samme spillerne.",
      "Ved oddetall går én spiller rett videre. Fortsett til én mester står igjen.",
    ],
  },
  {
    id: "emoji",
    name: "Emoji Decoder",
    subtitle: "Les mellom emojiene",
    description:
      "Filmer, steder og norske klassikere. Knekk koden med gjengen.",
    min: 1,
    time: "5–15 min",
    kind: "social",
    symbol: "☺",
    rules: [
      "Spilleren som vises gjetter hva emojiene betyr. Kategorien er et hint.",
      "Skriv svaret. Store bokstaver, mellomrom og tegnsetting spiller ingen rolle.",
      "Du har to forsøk. Riktig svar gir ett poeng; to feil eller vis fasit gir én valgfri slurk.",
      "Gjengen kan godkjenne et riktig alternativ appen ikke kjenner. Hopp over er alltid mulig.",
    ],
  },
  {
    id: "category-rush",
    name: "Category Rush",
    subtitle: "Ikke la det stoppe opp",
    description: "Én kategori. Ett nytt ord. Tiden løper på hver tur.",
    min: 2,
    time: "5–15 min",
    kind: "action",
    symbol: "⏱",
    rules: [
      "Velg en foreslått eller egen kategori. Den som velger svarer først. Klokken starter først når dere er klare.",
      "Gjengen godkjenner med «Godkjent – neste». Neste spiller får en ny tidsfrist.",
      "Ingen ord kan gjentas. Gjengen registrerer gjentakelse, upassende svar eller stopp. Ved tvil stemmer de andre; likt godkjenner svaret.",
      "Ved feil eller tidsslutt stopper runden. Spilleren som vises kan ta én valgfri slurk og velger neste kategori, eller gir valget videre. En brukt kategori kan ikke velges igjen.",
    ],
  },
  {
    id: "truth-train",
    name: "Truth Train",
    subtitle: "Ta en stopp hos hverandre",
    description: "Personlige spørsmål, en oppfølger og en gjeng som lytter.",
    min: 2,
    time: "10–20 min",
    kind: "social",
    symbol: "→",
    rules: [
      "Send enheten til spilleren som vises og svar på spørsmålet høyt.",
      "Vis oppfølgingsspørsmålet hvis dere vil snakke litt mer.",
      "Gjengen velger «Godkjent» eller «En slurk». Spilleren kan alltid hoppe over.",
      "Turen går rundt bordet med et nytt spørsmål uten gjentakelser.",
    ],
  },
  {
    id: "bus",
    name: "H-en + Bussruta",
    subtitle: "Hvem må ta bussen?",
    description:
      "Tøm hånden i H-en. De med flest kort igjen tar fire gjetninger og en pyramide uten bildekort.",
    min: 2,
    max: 8,
    time: "15–25 min",
    kind: "live",
    symbol: "↗",
    rules: [
      "Hver sin mobil: alle blir med i samme rom og får fire kort. Kortene ligger nederst på din egen skjerm. Trykk på dem for å se dem. Målet er å ha null kort igjen. H-en har fem kort på hver side og to som binder sidene sammen.",
      "Verten snur ett H-kort om gangen, annenhver side: ta én slurk, gi bort én slurk, og gjenta. Alle kan legge ett eller flere håndkort med samme verdi på det åpne kortet, rett fra sin egen mobil. Venstre side: gi én slurk til en valgfri spiller per kort. Høyre side: ta én slurk selv per kort. De to kortene i midten: ta en shot per match. Hele H-en skal snus.",
      "Den med flest håndkort igjen tar Bussruta. Ved likt antall spiller dere stein, saks, papir og velger taperen, eller tar hele Bussruta sammen. Har alle null kort, slipper alle bussen.",
      "Bussruta del 1: bussdeltakerne får fire nye kort. Gjett rød/svart, høyere/lavere enn kort 1, innenfor/utenfor kort 1 og 2, og sort. Alle tar ett kort hver før neste gjetterunde. Riktig: gi bort 1, 2, 3 eller 4 slurker. Feil: ta samme antall selv. Ess er høyest; like verdier og treff på en grense teller som feil.",
      "Bussruta del 2: trykk på ett kort i hver pyramiderad, fra bunnen til toppen. Unngå knekt, dame og konge. Ess er trygt. Bildekort på rad 1–4 gir 2, 4, 6 eller 8 slurker. Bildekort på toppen gir en shot.",
      "Et bildekort stokker og nullstiller hele pyramiden. Begynn på nederste rad igjen. Fortsett til dere når toppen uten bildekort. Dere kan alltid avslutte bussturen.",
    ],
  },
  {
    id: "spy",
    name: "Hvem er spionen?",
    subtitle: "Alle vet hvor dere er. Nesten.",
    description:
      "Alle ser stedet unntatt spionen. Still spørsmål, bløff og avslør hvem som ikke hører til.",
    min: 3,
    max: 12,
    time: "10–15 min",
    kind: "live",
    symbol: "?",
    rules: [
      "Hver sin mobil: alle blir med i samme rom. Trykk på kortet nederst på skjermen for å se rollen din. Bare du ser den.",
      "Alle unntatt én ser stedet. Spionen ser bare listen over mulige steder.",
      "Dere stiller hverandre spørsmål om stedet, på skift og høyt. Svar så riktig at spionen ikke gjetter, men så vagt at spionen ikke blir med på stedet.",
      "Spionen kan når som helst gjette stedet. Riktig: spionen vinner. Feil: spionen taper og tar to slurker.",
      "Når verten åpner avstemmingen, stemmer alle i skjul på hvem de tror er spionen. Flest stemmer avslører spionen og spionen tar to slurker. Slipper spionen unna, tar alle de andre en slurk.",
    ],
  },
  {
    id: "werewolf",
    name: "Varulv",
    subtitle: "Natta faller. Ulvene våkner.",
    description:
      "Hemmelige roller. Ulvene tar én hver natt, landsbyen stemmer ut én hver dag. Hvem er ulven?",
    min: 4,
    max: 12,
    time: "15–30 min",
    kind: "live",
    symbol: "☾",
    rules: [
      "Hver sin mobil: alle får en hemmelig rolle. Trykk på kortet nederst på skjermen for å se din. Fra fem spillere er én av landsbyboerne en seer.",
      "Natt: ulvene velger i hemmelighet et offer. Seeren velger en spiller og får vite om hen er ulv. Alle andre venter.",
      "Dag: alle ser hvem som er borte, snakker sammen og stemmer ut den de tror er ulven. Flest stemmer går ut. Likt antall stemmer betyr at ingen går ut.",
      "Landsbyen vinner når alle ulvene er borte. Ulvene vinner når de er like mange som resten. Den som er ute, ser på videre uten å si noe.",
      "Den som blir tatt ut, av ulvene eller av stemmen, tar en slurk. Når runden er over, tar hele taperlaget en slurk til.",
    ],
  },
  {
    id: "bluff",
    name: "Snyd",
    subtitle: "Tror du på ham?",
    description:
      "Legg kort med bunnen opp og påstå hva de er. Tviler noen, må den som tok feil ta hele bunken.",
    min: 2,
    max: 6,
    time: "10–20 min",
    kind: "live",
    symbol: "♣",
    rules: [
      "Hver sin mobil: kortstokken deles likt, og du ser bare din egen hånd nederst på skjermen.",
      "På din tur legger du ett til fire kort med bunnen opp og sier hvilken verdi de har. Verdien går oppover: ess, to, tre og så videre, rundt og rundt.",
      "Den neste spilleren kan tro på det og legge sine kort, eller kalle det løgn.",
      "Kalles det løgn, snus kortene. Var det snyd, tar den som la kortene hele bunken. Var det sant, tar den som kalte det hele bunken. Den som tar bunken, tar også en slurk.",
      "Først tom for kort vinner. Alle andre tar like mange slurker som de har kort igjen.",
    ],
  },
  {
    id: "liars-dice",
    name: "Løgnerdyst",
    subtitle: "Fem terninger. Én løgn.",
    description:
      "Fem terninger under koppen. Byd opp hvor mange som finnes på bordet, eller kall budet løgn.",
    min: 2,
    max: 8,
    time: "10–20 min",
    kind: "live",
    symbol: "⚅",
    rules: [
      "Hver sin mobil: alle har fem terninger og ser bare sine egne. Trykk på koppen nederst på skjermen for å se dem.",
      "På din tur byr du: hvor mange terninger av én verdi dere tror det finnes til sammen på hele bordet. Enere teller som alle verdier.",
      "Neste spiller må øke budet, med flere terninger eller samme antall på en høyere verdi, eller kalle det løgn.",
      "Kalles det løgn, vises alle terningene. Finnes det minst så mange som budet, mister den som kalte en terning. Ellers mister den som bød. Den som mister en terning, tar også en slurk.",
      "Den som mister alle terningene er ute. Siste spiller med terninger igjen vinner.",
    ],
  },
  {
    id: "two-truths",
    name: "To sannheter og en løgn",
    subtitle: "Hvilken av de tre lyver?",
    description:
      "Skriv tre påstander om deg selv, hvorav én er løgn. Gjengen stemmer i skjul på hvilken.",
    min: 3,
    max: 12,
    time: "15–30 min",
    kind: "live",
    symbol: "≟",
    rules: [
      "Hver sin mobil: spillerne skriver på tur, og de andre stemmer på sin egen mobil.",
      "Du som er på tur skriver tre påstander om deg selv. To er sanne og én er løgn, og du markerer hvilken.",
      "Alle andre stemmer i skjul på hvilken de tror er løgnen. Alle ser påstandene på sin egen mobil.",
      "Så vises svaret. De som gjettet feil, tar en slurk. Lot ingen seg lure, tar den som skrev to slurker.",
      "Turen går videre til neste spiller.",
    ],
  },
];
export const gameById = (id: string) => games.find((game) => game.id === id);
/** Live games run with a phone per player; every other game needs one phone. */
export const needsOwnPhones = (game: { kind: GameDefinition["kind"] }) =>
  game.kind === "live";
