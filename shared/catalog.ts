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
  | "bus";
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
    description: "Hver sin enhet, samme spill. Del en kode og stem i skjul.",
    min: 2,
    time: "Så lenge dere vil",
    kind: "live",
    symbol: "↗",
    rules: [
      "Logg inn med SpillArena-kontoen din og opprett eller bli med i et rom.",
      "Del koden eller invitasjonslenken. Rommet har plass til 16 spillere.",
      "Verten velger Truth or Sip, Jeg har aldri eller Who’s Most Likely?.",
      "Spørsmålene vises samtidig. I Who’s Most Likely? stemmer alle privat.",
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
    name: "Bussruta",
    subtitle: "Alle om bord!",
    description:
      "Fire gjetninger, en pyramide og én sjåfør. Hvem sitter igjen med kortene?",
    min: 2,
    max: 8,
    time: "15–25 min",
    kind: "cards",
    symbol: "↗",
    rules: [
      "Én enhet, 2–8 spillere. Fire kort per spiller og 15 i pyramiden fra samme stokk. Ess er alltid høyest, og like kort teller som feil.",
      "Del 1: bekreft hvem som holder mobilen. Gjett rød/svart, høyere/lavere, innenfor/utenfor og sort. Innenfor er strengt mellom de to første kortene; likt med en av grensene er feil i begge valg. Riktig gir ett poeng, feil én valgfri slurk.",
      "Husk de fire kortene dine og skjul hånden før du gir mobilen videre. De andre skal se bort mens du spiller.",
      "Del 2: snu pyramiden fra bunnen. Velg spiller, bekreft overlevering og vis bare deres hånd. Et kort med samme verdi kan legges én gang og gir radens poeng (1–5), pluss muligheten til å gi én valgfri slurk til en annen. Skjul hånden før mobilen går tilbake.",
      "Etter pyramiden kjører den med flest restkort bussen, uavhengig av poeng. Ved likt antall trekkes én av disse tilfeldig. Har alle tømt hånden, slipper alle bussturen.",
      "Del 3: sjåføren gjetter høyere/lavere fire ganger gjennom fem kort. Feil starter et nytt forsøk med en ny stokket bunke. Maks tre forsøk, én valgfri slurk per feil. Du kan alltid avslutte bussturen.",
    ],
  },
];
export const gameById = (id: string) => games.find((game) => game.id === id);
