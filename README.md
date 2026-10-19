# SipZone

**Gode venner. Dårlige unnskyldninger.**

Norske drikkeleker for vors, hyttetur og spillkveld. En del av
[SpillArena](https://spillarena.no/), med samme konto, lagringsvalg og navigasjon.

MVP-en er implementert lokalt. Cloudflare-ressurser og domeneruting er ikke
publisert fra dette repoet ennå.

## Spill

| Lek                 | Implementert                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| Sip Roulette        | Hjul med åtte felt, slurker, utfordringer og turbytte.                                            |
| Truth or Sip        | 36 norske spørsmål. Svar, ta en slurk eller hopp over.                                            |
| Never Have I Ever   | 36 norske påstander på felles skjerm.                                                             |
| Higher or Lower     | 52 kort, rask runde/rekkemodus, valgbart ess/like kort og sikring av poeng.                       |
| Who’s Most Likely?  | 36 spørsmål, samtidig peking eller skjult avstemming på én enhet.                                 |
| Hot Potato          | Send enheten rundt før en skjult tilfeldig tidtaker går ut.                                       |
| Card of Fate        | 52 kort, 13 regler, synlige makkerpar, husregler og fjerde konge.                                 |
| SipZone Live        | Rom og lobby med synkroniserte spørsmål og privat avstemming.                                     |
| Sip or Dare         | 48 utfordringer, kategorier, rolig/modig nivå og mulighet til å hoppe over.                       |
| Spin the Bottle     | Animert flaske, like sjanser per spiller, spørsmål og utfordringer.                               |
| The Snus Box        | Overlevering, animert lokk og 24 tilfeldige oppgaver uten gjentakelser.                           |
| Quickfire Questions | 30 spørsmål, fire svar, tidsfrist, personlige poeng og serier.                                    |
| Sip Showdown        | Tilfeldig utslagsturnering for 2–16 spillere, omkamp og fripass ved oddetall.                     |
| Emoji Decoder       | 24 oppgaver, svarvarianter, to forsøk, poeng og manuell godkjenning.                              |
| Category Rush       | 30 forslag og egne kategorier, taperen velger neste, tidsfrist og manuell dømming.                |
| Truth Train         | 24 personlige spørsmål med oppfølgere og gruppens godkjenning.                                    |
| H-en + Bussruta      | 2–8 spillere. Tøm hånden i H-en; taperne gjetter på rundgang og klatrer en pyramide uten bildekort. |

De 16 lokale lekene trenger ingen konto. Spillere, lokale runder og poeng
lever i minnet i fanen. Gjengen følger med når dere bytter lek.
Spørsmålslekene har kategoriene **vors**, **hytta** og **venner**. En økt
bruker bare unike spørsmål: velger du 20 runder i en kategori med 12 spørsmål,
blir økten 12 runder. De tre opprinnelige spørsmålslekene har 108 spørsmål og påstander.
Sip or Dare har 24 oppgaver per nivå, åtte per kategori; rundetallet
avkortes til antall unike oppgaver i utvalget. Quickfire og Category Rush
har valgbar tidsfrist på 5, 10 eller 15 sekunder. Klokken fortsetter ved
fanebytte, og svar etter fristen teller som tidsslutt. Category Rush og
Showdown dømmes av gjengen. Alle nye leker bruker den felles turmarkeringen
og mobilkontrollene, med plass til kontopillen nederst.

SipZone Live bruker SpillArena-kontoer og har ni leker: **Who’s Most Likely?**,
**Higher or Lower**, **Emoji Decoder**, **Quickfire**, **Hot Potato**,
**Sip Roulette**, **Sip or Dare**, **Truth or Sip** og **Never Have I Ever**.
Svar og gjetting er private til runden avsluttes, quizene gir poeng, og
Hot Potato-fusen ligger bare på serveren. Spillerne vises med kontobilde og navn.
Rommet har opptil 16 deltakere. Verten velger lek, starter runder og viser avstemningen.
Ved likt resultat deler spillerne førsteplassen. Verten kan gå tilbake til
lobbyen for å slippe inn flere eller bytte lek. Rommet utløper etter 24 timer.

Live er fremhevet på forsiden. Velg **Opprett rom** eller
**Bli med**; en invitasjonslenke fyller inn romkoden automatisk. Ved behov
åpnes innloggingen i den vanlige kontopillen nederst til høyre, og opprettelse
eller tilkobling fortsetter automatisk etter innlogging. Hver deltaker bruker
sin egen enhet og SpillArena-konto. Headeren viser ingen profilinformasjon.

Alle de **43 foreslåtte lekene** er beskrevet i [TODO.md](TODO.md), med **17 implementerte** (åtte MVP-deler og ni nye leker) og **26 gjenstående**.

Regelgjennomgangen av Drikkespill.no og Annes Drikkeleker er beskrevet i
[docs/SPILLREGLER.md](docs/SPILLREGLER.md). Higher or Lower beholder rask modus
som standard (ess lavt og trygge like kort), med valgfri rekkemodus og husregler.
Category Rush starter med fem sekunder per spiller; taperen får kategorivalget
og kan gi det videre. Makkerpar i Card of Fate varer til noen velger ny makker
eller økten slutter. Disse er SipZones avtalte varianter.

Bussruta bruker én stokk til fire kort per spiller og 15 pyramidekort. Hender
vises først etter bekreftet overlevering og skjules igjen før mobilen går videre.
Det er ingen valgbart rundetall: økten følger de tre fasene. Bussturen bruker
fem nye kort per forsøk, med ess høyest, like kort som feil og høyst tre forsøk.
Se alle regelvalgene i [SPILLREGLER.md](docs/SPILLREGLER.md).

Footeren har kontakt, FAQ, personvern og vilkår som peker til SpillArena i en
ny fane, samt lagringsvalg, GitHub og `support@spillarena.no`. Lenker og
kontaktadresse er hentet fra det oppdaterte SpillArena-repoet. Kontaktmeldingene
sendes gjennom hubens eksisterende skjema.

## Lokal oppstart

Bruk Node.js 24 og npm:

```bash
npm ci
npm run dev
```

Åpne adressen Vite skriver ut, normalt
[localhost:5173/sipzone/](http://localhost:5173/sipzone/). Hvis porten er opptatt,
velger Vite neste ledige port. De 16 lokale lekene virker med bare Vite.

### Konto og Live lokalt

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
