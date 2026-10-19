# SipZone

**Gode venner. Dårlige unnskyldninger.**

Norske drikkeleker for vors, hyttetur og spillkveld. En del av
[SpillArena](https://spillarena.no/), med samme konto, lagringsvalg og navigasjon.

MVP-en er implementert lokalt. Cloudflare-ressurser og domeneruting er ikke
publisert fra dette repoet ennå.

## Spill og prioritering

**H-en + Bussruta er det eneste tilgjengelige spillet.** Vi prioriterer kvalitet
før vi åpner flere leker. De øvrige spillene er skjult fra forsiden, direkte
spillsider og spillvalget i rommet, og er merket **TODO** i [TODO.md](TODO.md).
Koden beholdes som utgangspunkt for senere arbeid.

Bussruta spilles av **2–8 spillere på hver sin mobil**, med SpillArena-konto.
Én oppretter et rom, og resten blir med med kode eller invitasjonslenke.
Rekkefølgen er **Fire gjetninger → H-en → Pyramiden**. Før hver fase vises en
animert intro med korte regler og klarstatus for alle spillerne. Alle må trykke
«Jeg er klar» på sin egen enhet før fasen starter. Dette håndheves på serveren;
verten kan ikke starte fasen alene. Pyramiden åpner direkte på første rad etter introen.
Trygge pyramidekort aktiverer neste rad automatisk, med animasjon og flytting av fokus.
Ved bildekort vises treffet først, deretter at pyramiden går tilbake til start.
Etter tre sekunder vises drikkevinduet med bildekortet og antall slurker én gang.
Når alle på bussen har bekreftet, stokkes pyramiden og et nytt forsøk starter automatisk.
Avslutningen har en egen scene med resultat, spillerne og «Ny runde · til lobbyen».
Alle kan åpne den nye lobbyen etter fullført runde; hele gjengen følger med automatisk
og beholder romkoden. Verten starter neste runde med nye kort og ny klarstatus.
Alle gjetter ett kort
hver på rundgang i fire runder. De samme fire kortene blir hånden i H-en,
og H-kortene tas fra resten av samme kortstokk. Hånden vises i en dock nederst. Når docken er minimert,
vises toppen av hvert kort. Trykk på et hvilende kort for å vise
full høyde, og trykk på et kort uten match igjen for å minimere. Kort som matcher
et snudd H-kort, løftes automatisk til full høyde mens de øvrige hviler nederst.
Trykk på et spillbart håndkort for å legge det automatisk på det sist snudde
H-kortet med samme verdi. Slurkeregelen følger dette H-kortet; ved «gi bort»
velger du bare hvem som skal drikke. Tøm hånden i H-en; de med flest kort igjen
går til pyramiden uten nye gjetninger eller ny hånd.
Fire gjetninger har en kompakt mobilvisning med én turlinje, fire kort og svarvalg.
Regler og romdetaljer åpnes ved behov. Spillere som venter ser «Ser på X»
og «X sine kort», så de delte kortene ikke forveksles med deres egen hånd. Ved feil svar vises kortet og «Feil svar»
i to sekunder før drikkebekreftelsen åpnes. Spilleren må bekrefte å ha drukket. Ved riktig svar vises
spillervalget etter to sekunder, med avatar og navn. Mottakeren må trykke
«Jeg har drukket» før turen går videre. Bare riktig mottaker kan bekrefte,
og bekreftelsen kontrolleres på serveren, også i H-en og pyramiden.
Informasjonsvarsler vises i høyst ti sekunder og kan lukkes med krysset.
De fjernes hos både giver og mottaker straks drikkingen bekreftes. Å lukke
et varsel eller vente på at det forsvinner erstatter aldri drikkebekreftelsen. Kort, turbytte, popup og varsler har animerte overganger. Lobby og faser bytter
med en kort overgang; kort deles ut forskjøvet og flytter seg mykt på hånden.
Vinduer og varsler får en 150 ms uttoning uten aktive kontroller. Redusert
bevegelse slår av bevegelsene og bruker umiddelbare overganger.
Se reglene i spillet og [SPILLREGLER.md](docs/SPILLREGLER.md).

Rom, innlogging og invitasjoner bruker fortsatt SipZone Live. Eksisterende
`#/live/<romkode>`-lenker fungerer, og nye rom velger Bussruta automatisk.
`availableGames` i `shared/catalog.ts` styrer hvilke spill som vises og kan
åpnes i appen; rommets synlige spillvalg følger samme liste.

## Lokal oppstart

Bruk Node.js 24 og npm:

```bash
npm ci
npm run dev
```

Åpne adressen Vite skriver ut, normalt
[localhost:5173/sipzone/](http://localhost:5173/sipzone/). Hvis porten er opptatt,
velger Vite neste ledige port. Forsiden kan vises med bare Vite; Bussruta
trenger også romserveren og hubens konto-API som beskrevet under.

### Konto og Bussruta lokalt

| Tjeneste           | Port                     | Oppstart                     |
| ------------------ | ------------------------ | ---------------------------- |
| SipZone            | 5173, eller neste ledige | `npm run dev`                |
| Romserver          | 8788                     | `npm run rooms:dev`          |
| SpillArena-kontoer | 8789                     | Hubens lokale Pages-tjeneste |

Lag `workers/rooms/.dev.vars` med `AUTH_SECRET` satt til **samme lokale
signeringsnøkkel som huben**, og start romserveren. Filen er ignorert av Git.

Hubens database, migrasjoner og konto-API startes fra SpillArena-repoet slik
hubens README beskriver. Vite videresender `/api/auth`, `/api/profile` og
`/api/account` til port 8789 og romkall, inkludert WebSockets, til port 8788.
`VITE_ACCOUNT_API` kan overstyre kontotjenestens baseadresse.

Romtilgang ligger i minnet. Ved oppfriskning åpner invitasjonslenken romkoden;
logg inn og velg **Bli med** for å gjenopprette plassen. Den bekreftede kontoen
beholder samme spiller-ID og får et nytt privat romtegn. Bruk **Forlat rom**
for å gi vertskapet videre; det å lukke fanen fjerner ikke medlemskapet.

## Utvikling og verifikasjon

| Kommando               | Formål                                                      |
| ---------------------- | ----------------------------------------------------------- |
| `npm run dev`          | Vite, lokal utvikling og API-/WebSocket-proxy.              |
| `npm run build`        | Typekontroll og produksjonsbygg til `dist/`.                |
| `npm run preview`      | Vis produksjonsbygget, uten utviklingsproxyene.             |
| `npm run lint`         | ESLint for SipZone-koden. Kopiert kontokode holdes separat. |
| `npm test`             | Spillregler, innhold, timer, avstemming, rom og kontotegn.  |
| `npm run test:rooms`   | Isolert lokal Worker med testnøkkel og ekte WebSockets.     |
| `npm run pages:check`  | Kompiler Pages Functions uten publisering.                  |
| `npm run pages:types`  | Generer Pages-bindingstyper fra Wrangler-konfigurasjonen.   |
| `npm run pages:dev`    | Lokal Pages-visning av `dist/`.                             |
| `npm run rooms:dev`    | Lokal romserver på 8788.                                    |
| `npm run rooms:types`  | Generer bindingstyper fra Wrangler-konfigurasjonen.         |
| `npm run rooms:check`  | Pakk romserveren uten publisering.                          |
| `npm run rooms:deploy` | Publiser romserveren til Cloudflare.                        |

Romtesten starter og stopper sin egen runtime med separat lagring og en
tilfeldig testnøkkel. Den trenger hverken hub, innlogging eller eksisterende rom.


For mobilgjennomgang: start `npm run dev` og åpne
`/sipzone/tests/mobile-layout/index.html`. Siden sjekker reelle spillkomponenter
ved 320, 375 og 430 px, liggende 812 × 375 og skrivebord 1280 × 800, med lange
spillernavn. Velg en enkeltscene for å prøve knapper og spilltilstander manuelt.
Den måler horisontal overflyt og om handlingsfelter dekker spillinnhold; visuell
kontroll og test på en fysisk mobil kommer i tillegg. Live-brettene bruker lokale
romdata og tester ikke tilkoblingen til romserveren. Gjennomgangssiden følger
ikke med i produksjonsbygget.

## Struktur

```text
src/
  account/             Delt klient kopiert fra SpillArena-huben
  ui/                  SiteShell, innstillinger, dialoger og illustrasjoner
  features/
    Home.tsx           Spilloversikt og filtre
    Setup.tsx          Spillerliste, kategorier, regler og rundevalg
    LocalGame.tsx      Felles spillramme, hjelp og rundeslutt
    live/              Romlobby, WebSocket-klient og vertskontroller
  games/               Egen komponent per mekanikk og delte kortkontroller
  i18n.tsx             Tema og språkvalg delt med huben
  styles.css           SipZones bord-, kort- og mobilutforming
  mobile-games.css      Tydelig turmarkering og mobiltilpassede spillkontroller
  party-games.css       Illustrasjoner og oppsett for de åtte nye lekene
  bus.css               H-en + Bussruta, private hender og pyramide
  live.css              Live-fremheving, enkelt romoppsett og plass til kontopillen
shared/
  catalog.ts           De 17 spilloppføringene og deres regler
  content.ts           Norske spørsmål, påstander og roulettefelt
  engine.ts            Rene regler for kort, avstemming og tidtaking
  party-content.ts     Oppgaver, quiz, emojis og kategorier til de åtte nye lekene
  party-engine.ts      Svarmatching, tidsfrister, flaskevinkel og turnering
  higher-lower.ts      Turtilstand, rekkemodus og sikring av poeng
  fate-partners.ts     Gjensidige makkerpar og erstatning av gamle par
  bus.ts               Ren tilstandsmaskin for Bussrutas tre faser
  rooms.ts             Romtilstand, handlinger og offentlig visning
  auth.ts              Verifisering av hubens kontotegn
functions/             Pages-ruter til den private romserveren
workers/rooms/         Durable Objects, SQLite og WebSockets
tests/                 Enhets- og integrasjonstester
docs/                  Opprinnelig oppsettsplan og designskisse
```

Spillkode og dokumentasjon for skjulte TODO-leker beholdes i repoet.

Grunnlaget følger Hitline: React 19, TypeScript 6, Vite 8, egen CSS,
lokalt hostet Archivo og Lucide. Navigasjon og footer er hentet fra Hitline;
`src/account/` er kopiert fra hubens hovedkopi og skal oppdateres derfra.
Kontopillen er den uendrede `AccountBadge`-komponenten fra Hitline, med
standard plassering og styling. Live åpner den på samme måte som Hitline.

Norsk er første innholdsspråk. Navigasjon og sentrale kontroller har engelsk
visning; spørsmål, spillbeskrivelser og detaljerte regler er foreløpig norske.
Tema støtter mørk, lys og system. `lang`, `theme`, `cookie-consent` og
`spillarena.session` følger resten av SpillArena. Innstillinger lagres bare
etter samtykke, og et avslag gjelder hele domenet.

Lokale runder og Live-resultater gir foreløpig ingen personlig profil,
XP eller ledertavle. Det kreves derfor ingen endring i hubens profilregister.

## Cloudflare

Pages-prosjektet er konfigurert som **`sipzone`**, med byggekommando
**`npm run build`**, publiseringsmappe **`dist/`** og servicebinding
**`ROOMS_API → sipzone-rooms`**. Romserveren er en separat Worker med ett
SQLite-basert Durable Object per rom.

Før publisering:

1. Sett romserverens `AUTH_SECRET` via Wrangler til samme verdi som huben:
   `npx wrangler secret put AUTH_SECRET -c workers/rooms/wrangler.jsonc`.
2. Publiser romserveren med `npm run rooms:deploy`.
3. Opprett/koble Pages-prosjektet `sipzone` til repoet, med bygg og binding
   som over. Ved direkte opplasting: bygg først, og bruk
   `npx wrangler pages deploy dist --project-name sipzone`.
4. Koble `/sipzone` og `/sipzone/*` i SpillArenas eksterne domenerouter og
   fjern prefikset ved videresending til Pages. Behold hubens konto-API på `/api/*`.
5. Legg SipZone-kort og lenke i huben.

En direkte Pages-forhåndsvisning kan bygges med `VITE_BASE_PATH=/`. Kontoen
deles automatisk først når spillene ligger på samme origin som SpillArena.

Serveren kontrollerer konto, romtilgang, vert, runde og revisjoner. Offentlig
romtilstand inneholder bare gjeldende spørsmål, deltakernavn og anonyme
resultater etter avsløring. Fremtidige spørsmål og andre spilleres tegn sendes
aldri ut. WebSocket-tilkoblinger bruker engangsbilletter som varer i 30 sekunder;
langlivede kontotegn sendes i HTTP-headeren. Automatisk gjenoppkobling henter
gjeldende romtilstand på nytt.

Kontoverifiseringen følger søsterprosjektene: signatur og utløp kontrolleres
lokalt. Romserveren gjør ikke huboppslag for å kontrollere tilbakekalte tegn.

Se også [TODO-listen](TODO.md), [opprinnelig oppsettsplan](docs/OPPSETT.md) og
[designskissen](docs/design/index.html).
