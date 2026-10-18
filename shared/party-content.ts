import type { Category } from "./catalog.ts";

export type DareLevel = "easy" | "bold";
export interface Dare {
  text: string;
  category: Exclude<Category, "all">;
  level: DareLevel;
}
const dareGroups: [Dare["category"], DareLevel, string[]][] = [
  [
    "vors",
    "easy",
    [
      "Presenter glasset ditt som om det er kveldens hovedsponsor.",
      "Lag en skål som inneholder ordene fredag og vaffel.",
      "Dans sittende i ti sekunder uten å bruke armene.",
      "Nynn en selvvalgt låt. La gjengen gjette tittelen.",
      "Snakk som en sportskommentator frem til neste tur.",
      "Finn på et nytt navn til denne festen.",
      "Vis ditt beste luftgitar-riff i ti sekunder.",
      "Hold en værmelding for stemningen i rommet.",
    ],
  ],
  [
    "hytta",
    "easy",
    [
      "Selg inn en vedkubbe som årets julegave.",
      "Lag lyden av tre dyr dere kunne møtt på fjellet.",
      "Vis med mime hvordan du setter opp et telt i motvind.",
      "Hold en høytidelig tale til en imaginær termos.",
      "Finn på et fjellnavn og forklar hvorfor det heter det.",
      "Vis hvordan en overivrig skiløper kommer inn på afterski.",
      "Beskriv drømmehytta di med bare fem ord.",
      "Spill en GPS som har mistet all retningssans.",
    ],
  ],
  [
    "venner",
    "easy",
    [
      "Gi personen til venstre et oppriktig kompliment.",
      "Presenter deg selv med en helt unødvendig jobbtittel.",
      "Mime en hobby og la gjengen gjette.",
      "Gi hver person et vennlig superheltnavn.",
      "Fortell om dagen din med tre lydeffekter.",
      "Tegn en katt i luften med albuen.",
      "Lag et håndtegn for gjengen som alle kan kopiere.",
      "Si en setning med tre forskjellige dialekter.",
    ],
  ],
  [
    "vors",
    "bold",
    [
      "Hold en tjue sekunders valgkamptale for at mandag skal bli helg.",
      "Improviser et refreng om noe som ligger på bordet.",
      "Vis et helt dansegulv med tre forskjellige dansepersonligheter.",
      "Lag en reklame for vann med dramatisk fortellerstemme.",
      "Spill både dørvakt og gjest i en liten, vennlig dialog.",
      "Lat som du leder en prisutdeling. Del ut kveldens første pris.",
      "Rap fire linjer om veien hit i kveld.",
      "Fortell en oppdiktet festhistorie baklengs: slutt, midtdel, start.",
    ],
  ],
  [
    "hytta",
    "bold",
    [
      "Hold en dramatisk monolog fra perspektivet til en glemt ullsokk.",
      "Improviser et naturprogram om en helt vanlig stol.",
      "Spill en overivrig turleder som prøver å få alle ut i regnet.",
      "Lag en hyttekrim med tre mistenkte på tjue sekunder.",
      "Hold en salgspresentasjon for verdens dårligste skismøring.",
      "Forklar en oppdiktet fjellvettregel som en nyhetsanker.",
      "Syng en selvlaget hyttesang med minst fire linjer.",
      "Spill en dialog mellom to mygg som vurderer kveldens buffet.",
    ],
  ],
  [
    "venner",
    "bold",
    [
      "La gjengen velge et vanlig ord. Hold en tjue sekunders tale om det.",
      "Spill tre roller i en oppdiktet familiesamtale om pizza.",
      "Lag en filmtrailer om din egen helt vanlige morgen.",
      "Forklar mobilen din som om du er en oppfinner fra 1800-tallet.",
      "Hold en improvisert takketale for prisen Årets sofagjest.",
      "Fortell en historie der gjengen får velge det siste ordet i hver setning.",
      "Lag et lite standup-innslag om kollektivtransport.",
      "Vis en saktefilm av noen som oppdager at de har vunnet i lotto.",
    ],
  ],
];
export const dares: Dare[] = dareGroups.flatMap(([category, level, texts]) =>
  texts.map((text) => ({ text, category, level })),
);
export const bottleQuestions = [
  "Hva ville du kalt selvbiografien din?",
  "Hvilken liten ting gjør deg urimelig glad?",
  "Hva var din aller første konsert?",
  "Hva er ditt mest ubrukelige talent?",
  "Hvilken norsk matrett ville du forsvart i en debatt?",
  "Hvilken film kan du se om igjen?",
  "Hva ville du brukt en helt fri tirsdag til?",
  "Hva er det rareste du har pakket til en tur?",
  "Hvilken låt får deg alltid i godt humør?",
  "Hva er ditt beste tips til en regnværsdag?",
  "Hva er den mest undervurderte snacksen?",
  "Hvilken jobb ville du prøvd i én dag?",
  "Hvilket sted i Norge vil du besøke?",
  "Hva var den første hobbyen din?",
  "Hva ville du tatt med til en øde hytte?",
  "Hva er den beste gaven du har laget selv?",
  "Hvilken oppfinnelse skulle du ønske fantes?",
  "Hva er ditt morsomste reiseminne?",
  "Hva bestiller du på en veikro?",
  "Hvilken fiktiv person ville du invitert på middag?",
  "Hva er ditt mest nostalgiske TV-program?",
  "Hva ville du lært om du hadde en uke fri?",
  "Hva er din favorittlyd?",
  "Hvilken ting mister du stadig hjemme?",
];
export const boxTasks = [
  "Boksen er en mikrofon. Hold kveldens korteste takketale.",
  "Velg noen som finner på et nytt navn til boksen.",
  "Alle viser sin beste grimase. Du kårer den mest kreative.",
  "Fortell en fun fact om deg selv som gjengen kan ha glemt.",
  "Gi boksen et slagord og les det som en reklame.",
  "Velg to spillere som finner på en felles skål.",
  "Du er DJ: nevn neste låt du ville satt på.",
  "Alle sier ett ord som beskriver kvelden så langt.",
  "Mime et norsk dyr. Gjengen gjetter.",
  "Spilleren til høyre gir deg et ord du må bruke i en setning.",
  "Gi et kompliment til personen som sendte deg boksen.",
  "Velg en makker. Finn på et lagnavn sammen.",
  "Alle som har vært på hyttetur i år kan skåle hvis de vil.",
  "Hold en fem sekunders tale for den norske sommeren.",
  "Finn på en uskyldig regel som bare gjelder frem til neste åpning.",
  "Vis med hendene hvor god denne kvelden er fra én til ti.",
  "Fortell hvilken mat du har mest lyst på akkurat nå.",
  "La alle gjette favorittfargen din før du avslører den.",
  "Boksen har landet: ta en valgfri slurk eller fortell en vits.",
  "Lag et nytt ord for følelsen når siste buss akkurat har gått.",
  "Hvem ville du hatt på laget ditt i en quiz? Forklar hvorfor.",
  "La gruppen velge en emoji som beskriver deg i kveld.",
  "Presenter en helt vanlig gjenstand i rommet som et museumsklenodium.",
  "Alle gir personen til venstre en tommel opp. Boksen godkjenner.",
];
export interface QuickQuestion {
  question: string;
  choices: readonly string[];
  answer: number;
}
export const quickQuestions: QuickQuestion[] = [
  { question: "Hva er 7 × 8?", choices: ["54", "56", "64", "48"], answer: 1 },
  {
    question: "Hva heter hovedstaden i Sverige?",
    choices: ["Oslo", "Helsingfors", "Stockholm", "København"],
    answer: 2,
  },
  {
    question: "Hvor mange minutter er det i to timer?",
    choices: ["90", "100", "120", "180"],
    answer: 2,
  },
  {
    question: "Hvilken farge får du ved å blande blått og gult i maling?",
    choices: ["Grønn", "Lilla", "Oransje", "Rød"],
    answer: 0,
  },
  {
    question: "Hvilket dyr sier mø?",
    choices: ["Sau", "Geit", "Hest", "Ku"],
    answer: 3,
  },
  {
    question: "Hvor mange sider har en sekskant?",
    choices: ["Fem", "Seks", "Sju", "Åtte"],
    answer: 1,
  },
  {
    question: "Hvilken måned kommer etter april?",
    choices: ["Mars", "Juni", "Mai", "August"],
    answer: 2,
  },
  {
    question: "Hva er halvparten av 90?",
    choices: ["30", "40", "45", "55"],
    answer: 2,
  },
  {
    question: "Hvilken planet kalles den røde planeten?",
    choices: ["Venus", "Jupiter", "Mars", "Saturn"],
    answer: 2,
  },
  {
    question: "Hvor mange dager har en vanlig uke?",
    choices: ["Fem", "Seks", "Sju", "Åtte"],
    answer: 2,
  },
  { question: "Hva er 12 + 19?", choices: ["29", "31", "33", "41"], answer: 1 },
  {
    question: "Hvilket land har Roma som hovedstad?",
    choices: ["Spania", "Hellas", "Frankrike", "Italia"],
    answer: 3,
  },
  {
    question: "Hva heter Norges nasjonaldag?",
    choices: ["1. mai", "17. mai", "7. juni", "24. desember"],
    answer: 1,
  },
  {
    question: "Hvilket instrument har vanligvis 88 tangenter?",
    choices: ["Fiolin", "Trompet", "Piano", "Tromme"],
    answer: 2,
  },
  {
    question: "Hvor mange centimeter er én meter?",
    choices: ["10", "100", "1000", "60"],
    answer: 1,
  },
  { question: "Hva er 9 × 3?", choices: ["21", "24", "27", "30"], answer: 2 },
  {
    question: "Hvilken årstid kommer etter høsten?",
    choices: ["Vår", "Sommer", "Vinter", "Høst"],
    answer: 2,
  },
  {
    question: "Hvor mange hjul har en vanlig trehjulssykkel?",
    choices: ["To", "Tre", "Fire", "Fem"],
    answer: 1,
  },
  {
    question: "Hvilken av disse er en fugl?",
    choices: ["Grevling", "Torsk", "Elg", "Skjære"],
    answer: 3,
  },
  {
    question: "Hva er 100 delt på 4?",
    choices: ["20", "25", "40", "50"],
    answer: 1,
  },
  {
    question: "Hva heter den kjente historiske bebyggelsen ved Vågen i Bergen?",
    choices: ["Bryggen", "Aker Brygge", "Nidarosdomen", "Holmenkollen"],
    answer: 0,
  },
  {
    question: "Hvor mange nuller er det i tusen?",
    choices: ["To", "Tre", "Fire", "Fem"],
    answer: 1,
  },
  {
    question: "Hvilket hav ligger mellom Europa og Nord-Amerika?",
    choices: ["Stillehavet", "Atlanterhavet", "Indiahavet", "Sørishavet"],
    answer: 1,
  },
  {
    question: "Hva heter vann i fast form?",
    choices: ["Damp", "Is", "Tåke", "Regn"],
    answer: 1,
  },
  { question: "Hva er 15 − 7?", choices: ["6", "7", "8", "9"], answer: 2 },
  {
    question: "Hvilken bokstav kommer rett etter K i det norske alfabetet?",
    choices: ["J", "L", "M", "N"],
    answer: 1,
  },
  {
    question: "Hvilken av disse er et partall?",
    choices: ["13", "17", "22", "31"],
    answer: 2,
  },
  {
    question: "Hvor mange egg er et dusin?",
    choices: ["Seks", "Ti", "Tolv", "Tjue"],
    answer: 2,
  },
  {
    question: "Hvilken måned har færrest dager?",
    choices: ["Januar", "Februar", "Mars", "April"],
    answer: 1,
  },
  {
    question: "Hva er det motsatte av nord?",
    choices: ["Øst", "Vest", "Sør", "Opp"],
    answer: 2,
  },
];
export const showdownTasks = [
  "Stein, saks, papir. Best av tre vinner.",
  "Nevn norske byer annenhver gang. Første gjentakelse eller stopp taper.",
  "Mime et dyr hver. Gjengen velger den mest overbevisende.",
  "Nevn ting på en hytte annenhver gang. Første stopp taper.",
  "Lag hvert deres slagord for SipZone. Gjengen kårer vinneren.",
  "Hold hver deres ti sekunders tale for en vanlig skje. Gjengen stemmer.",
  "Nevn mat på bokstaven P annenhver gang. Første stopp taper.",
  "Tegn en katt i luften hver. Gjengen velger sin favoritt.",
  "Si annenhver bokstav i alfabetet, fra A. Første feil taper.",
  "Stein, saks, papir. Førstemann til tre seire vinner.",
  "Nevn norske dyr annenhver gang. Første gjentakelse taper.",
  "Finn på hvert deres superheltnavn. Gjengen bestemmer vinneren.",
  "Nynn en selvvalgt melodi hver. Den som blir gjettet raskest vinner.",
  "Nevn frukt og bær annenhver gang. Første stopp taper.",
  "Imiter en sportsreporter hver. Gjengen kårer sin favoritt.",
];
export interface EmojiPuzzle {
  emoji: string;
  topic: string;
  answer: string;
  aliases?: string[];
}
export const emojiPuzzles: EmojiPuzzle[] = [
  {
    emoji: "🦁👑",
    topic: "Film",
    answer: "Løvenes konge",
    aliases: ["Lion King", "The Lion King"],
  },
  { emoji: "❄️👭⛄", topic: "Film", answer: "Frost", aliases: ["Frozen"] },
  { emoji: "🐼🥋", topic: "Film", answer: "Kung Fu Panda" },
  {
    emoji: "🐟🔎🌊",
    topic: "Film",
    answer: "Oppdrag Nemo",
    aliases: ["Finding Nemo", "Nemo"],
  },
  {
    emoji: "🕷️🧑🏙️",
    topic: "Superhelt",
    answer: "Spider-Man",
    aliases: ["Spiderman", "Edderkoppmannen"],
  },
  { emoji: "🦇🧑🌃", topic: "Superhelt", answer: "Batman" },
  { emoji: "🧊🚢💔", topic: "Film", answer: "Titanic" },
  { emoji: "🧙‍♂️⚡👓", topic: "Filmfigur", answer: "Harry Potter" },
  {
    emoji: "💍🧙‍♂️🌋",
    topic: "Filmserie",
    answer: "Ringenes herre",
    aliases: ["Lord of the Rings", "The Lord of the Rings"],
  },
  {
    emoji: "👻🚫🚗",
    topic: "Film",
    answer: "Ghostbusters",
    aliases: ["Ghost Busters"],
  },
  { emoji: "🐀👨‍🍳🇫🇷", topic: "Film", answer: "Ratatouille" },
  { emoji: "🧸🤠🚀", topic: "Film", answer: "Toy Story" },
  {
    emoji: "🐝🍯🧸",
    topic: "Figur",
    answer: "Ole Brumm",
    aliases: ["Winnie the Pooh", "Winnie Pooh"],
  },
  {
    emoji: "🍎🏙️🇺🇸",
    topic: "By",
    answer: "New York",
    aliases: ["New York City", "NYC"],
  },
  { emoji: "🗼🥐🇫🇷", topic: "By", answer: "Paris" },
  { emoji: "🍕🏛️🇮🇹", topic: "By", answer: "Roma", aliases: ["Rome"] },
  { emoji: "☔🏘️⛰️🇳🇴", topic: "Norsk by", answer: "Bergen" },
  {
    emoji: "🧇🧀🤎",
    topic: "Norsk mat",
    answer: "Vaffel med brunost",
    aliases: ["Vafler med brunost", "Brunostvaffel"],
  },
  {
    emoji: "🌭🫓",
    topic: "Norsk mat",
    answer: "Pølse i lompe",
    aliases: ["Pølse med lompe"],
  },
  {
    emoji: "🐟🥔🥕",
    topic: "Norsk middag",
    answer: "Fisk med poteter og gulrøtter",
    aliases: ["Fisk og poteter", "Fisk med poteter", "Kokt fisk"],
  },
  {
    emoji: "🎅🎄🎁",
    topic: "Høytid",
    answer: "Jul",
    aliases: ["Julaften", "Christmas"],
  },
  { emoji: "🐣🥚🎿", topic: "Høytid", answer: "Påske", aliases: ["Påsken"] },
  {
    emoji: "🇳🇴🌭🍦🎺",
    topic: "Merkedag",
    answer: "17. mai",
    aliases: ["Syttende mai", "Nasjonaldagen"],
  },
  {
    emoji: "🛋️📺🍿",
    topic: "Fredagsplan",
    answer: "Filmkveld",
    aliases: ["Film kveld", "TV-kveld", "Tv kveld"],
  },
];
export const rushCategories = [
  "Norske byer",
  "Ting du finner på en hytte",
  "Frukt og bær",
  "Norske dyr",
  "Ting i et kjøleskap",
  "Filmtitler",
  "Farger",
  "Hovedsteder",
  "Ting på bokstaven S",
  "Yrker",
  "Musikkinstrumenter",
  "Ting du pakker til ferie",
  "Sportsgrener",
  "Grønnsaker",
  "Ting på et kjøkken",
  "Norske stedsnavn",
  "Artister og band",
  "Ting med hjul",
  "Ting som er runde",
  "Butikker",
  "Ting du kan gjøre når det regner",
  "Pålegg",
  "Klesplagg",
  "Dyr som lever i vann",
  "Ting på bokstaven B",
  "TV-serier",
  "Ting i en skolesekk",
  "Ting på en strand",
  "Noe som lukter godt",
  "Ting som lager lyd",
];
export const trainQuestions = [
  [
    "Når følte du sist at du fikk til noe skikkelig?",
    "Hvem ville du dele det med først?",
  ],
  ["Hva setter du mest pris på i et vennskap?", "Når merket du det sist?"],
  [
    "Hva har du ombestemt deg om det siste året?",
    "Hva fikk deg til å endre mening?",
  ],
  ["Hvilken liten tradisjon vil du beholde?", "Hvem vil du invitere med?"],
  [
    "Hva skulle du gjerne lært av noen i rommet?",
    "Hva kunne du lært bort tilbake?",
  ],
  ["Hva er en perfekt rolig søndag for deg?", "Hva ville du droppet helt?"],
  [
    "Hvilket minne fra en hyttetur sitter best?",
    "Hva gjorde øyeblikket spesielt?",
  ],
  [
    "Når lo du sist så du nesten ikke fikk puste?",
    "Kan du gjenskape litt av situasjonen?",
  ],
  ["Hvilken egenskap hos deg selv liker du best?", "Når har den hjulpet deg?"],
  ["Hva gleder du deg til akkurat nå?", "Hva er det første steget dit?"],
  [
    "Hvem lærte deg noe du fortsatt bruker?",
    "Hva ville du takket personen for?",
  ],
  [
    "Hva er den hyggeligste invitasjonen du har fått?",
    "Hvorfor husker du den?",
  ],
  [
    "Hva er en liten ting som redder en dårlig dag?",
    "Kan du gjøre mer plass til den?",
  ],
  ["Hvilken opplevelse vil du gjenta?", "Hvem ville du tatt med neste gang?"],
  ["Hva er en vane du er glad du har fått?", "Hvordan startet den?"],
  ["Når var du sist modigere enn du trodde?", "Hva overrasket deg?"],
  [
    "Hva vil du at vennene dine skal spørre deg oftere om?",
    "Hvorfor betyr det noe for deg?",
  ],
  [
    "Hvilken tur har gitt deg mest?",
    "Hva tok du med deg hjem, utenom bagasjen?",
  ],
  [
    "Hva er ditt beste minne rundt et middagsbord?",
    "Hvilken rett hører til minnet?",
  ],
  [
    "Hva er et råd som faktisk hjalp deg?",
    "Hvem kunne trengt det samme rådet?",
  ],
  ["Hva har du lyst til å gjøre for første gang?", "Hva skal til for å prøve?"],
  ["Når følte du deg sist ordentlig velkommen?", "Hva gjorde de andre?"],
  ["Hva vil du prioritere mer tid til?", "Hva kunne fått litt mindre plass?"],
  ["Hva liker du best med gjengen her?", "Hva burde dere finne på sammen?"],
] as const;
