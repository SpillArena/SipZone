# SipZone – alle leker og videre arbeid

Bussruta er eneste synlige spill mens vi prioriterer kvalitet. Alle andre leker
har status **TODO** og er skjult fra forside, direkte spillsider og rommets spillvalg.
Eksisterende kode beholdes som utgangspunkt for en senere kvalitetsgjennomgang;
uavkryssede punkter kan derfor allerede ha en implementasjon. De må gjennomgås
og verifiseres før de gjøres tilgjengelige igjen. Rom, konto og invitasjoner
brukes fortsatt av Bussruta.

## Tilgjengelig nå

- [x] **H-en + Bussruta:** 2–8 spillere på hver sin mobil. Fire gjetninger først;
      bruk de samme fire kortene i H-en. De med flest kort igjen tar pyramiden.

## TODO – skjulte leker

Alle spill nedenfor er satt på vent, inkludert Live-variantene. Prioriter
Bussruta før disse åpnes igjen.

## MVP

- [ ] **Sip Roulette:** animert hjul med åtte felt, slurker og utfordringer,
      turbytte, valgbart antall runder og redusert bevegelse.
- [ ] **Truth or Sip:** 36 norske spørsmål, tre kategorier, svar/slurk/hopp over,
      spillerrotasjon og en bunke uten gjentakelser i samme økt.
- [ ] **Never Have I Ever:** 36 norske påstander, kategorier og felles skjerm.
- [ ] **Higher or Lower:** 52 unike kort, rask runde eller rekkemodus,
      valgbart ess/like kort, sikring av poeng og automatisk sikring ved tom stokk.
- [ ] **Who’s Most Likely?:** 36 spørsmål, samtidig peking eller anonym
      avstemming ved å sende enheten rundt. Delt førsteplass håndteres.
- [ ] **Hot Potato:** skjult tilfeldig tidtaker, navngitt mottaker, absolutte
      tidsfrister og valg mellom slurk og en oppgave ved tidsslutt.
- [ ] **Card of Fate:** 52 kort med 13 regler, tommel-/spørsmålsmester,
      noterbare husregler, synlige makkerpar som oppdateres ved nytt valg,
      og avslutning ved fjerde konge.
- [ ] **SipZone Live:** kontobaserte rom, kode og invitasjonslenke, lobby,
      privat servicebinding, Durable Objects med SQLite, WebSocket-synkronisering,
      gjenoppkobling, vertsskifte og 24 timers utløp. Tre spørsmålsleker brukes
      som første moduler, med privat avstemming i Who’s Most Likely?.

## Én enhet – sendes rundt

- [ ] **Truth or Sip** – MVP over.
- [ ] **Sip or Dare:** 48 utfordringer i tre kategorier, rolig/modig nivå,
      valg mellom slurk og utfordring og mulighet til å hoppe over.
- [ ] **Who’s Most Likely?** – MVP over.
- [ ] **Never Have I Ever** – MVP over.
- [ ] **Spin the Bottle:** spillerplasser rundt flaske, tilfeldig mottaker,
      animasjon og oppgave-/spørsmålsvalg.
- [ ] **Sip Roulette** – MVP over.
- [ ] **Card of Fate** – MVP over.
- [ ] **Hot Potato** – MVP over.
- [ ] **The Snus Box / Pass the Box:** virtuell boks, overlevering, åpning og
      24 tilfeldige oppgaver og eget visuelt uttrykk med animert lokk.
- [ ] **Quickfire Questions:** korte spørsmål, tidsfrist, riktig/feil,
      30 spørsmål, valgbar tidsfrist, poeng og personlige serier av riktige svar.

## Én enhet – felles skjerm

- [ ] **Sip Showdown:** 15 duelloppgaver og tilfeldig utslagsturnering,
      vinner/taper, omkamp og fripass ved oddetall.
- [ ] **Higher or Lower** – MVP over.
- [ ] **Odd One Out:** fire alternativer, fasit og forklaring. Start med ord;
      legg til bilder og musikk når innholdskildene er avklart.
- [ ] **Emoji Decoder:** 24 emojioppgaver, aksepterte svarvarianter, to forsøk,
      fasit, poeng og manuell godkjenning.
- [ ] **Finish the Lyric:** avklar egne/lisensierte/selvskrevne tekster før
      innhold legges inn; bygg spørsmål, svar og fasit rundt godkjent materiale.
- [ ] **Category Rush:** kategoribibliotek, turer, timer og manuell registrering
      av gjentakelser, svar utenfor kategorien og stopp. 30 forslag,
      egne kategorier, ingen gjenbruk og valgbar tidsfrist. Taperen velger neste
      kategori eller gir valget videre; velgeren starter.
- [ ] **Sudden Death Quiz:** spørsmålsbibliotek, svaralternativer, eliminering,
      spiller-/lagoppsett og siste gjenstående deltaker.
- [ ] **Reaction Rush:** tilfeldig startsignal, reaksjonsmåling og lokal
      sammenligning. Avklar rettferdig inndata på én skjerm.
- [ ] **Truth Train:** 24 personlige spørsmål etter tur, valgfrie oppfølgere
      og gruppens avgjørelse.
- [ ] **Sip Bingo:** brett fra festhendelser, avkryssing, bingo og mulighet
      til å la spillet gå ved siden av andre leker.

## Flere enheter – én skjerm per spiller

- [ ] **SipZone Live** – felles ramme i MVP-en over.
- [ ] **Vote & Sip:** egen Live-modul med avstemmingskategorier, rundetid og
      en komplett resultatflyt. Hemmelig stemmegivning finnes allerede i Live MVP.
- [ ] **Live-leker:** Higher or Lower, Emoji Decoder, Quickfire, Hot Potato,
      Sip Roulette og Sip or Dare i rommene, med private svar, poeng og servertimer.
- [ ] **Sip or Dare Live, videre:** utfordring av andre spillere og kontroll
      over hvem som får se hvert valg.
- [ ] **Drawing Duel:** lerret, tegnerrolle, synkroniserte strøk og duellregler.
- [ ] **Guess the Drawing:** gjetting, tidsfrister og poeng for raskt riktig svar.
- [ ] **Fake Answer:** privat innsending av falske svar, blanding med fasit,
      avstemming og avsløring uten å røpe forfatterne for tidlig.
- [ ] **Sip Trivia:** samtidige svar, servermålt svartid og resultattavle.
- [ ] **Mafia: Sip Edition:** private roller, natt/dag, legetrekk, detektiv,
      avstemming og vilkår for seier.
- [ ] **Werewolf: Last Call:** enklere rollefordeling, natt/dag, eliminering
      og vilkår for seier.
- [ ] **Sip Race:** felles oppgaveserie, servervaliderte fullføringer og
      rangering etter mottakstid.
- [ ] **Secret Sip:** hemmelig rolle/oppgave, spørsmålsfase, avstemming og avsløring.

## Nye norske klassikere – fra regelgjennomgangen

Bussruta er tilgjengelig som H-en + Bussruta. De øvrige klassikerne er TODO. Inspirasjon er hentet
fra [Drikkespill.no](https://drikkespill.no/) og
[Annes Drikkeleker](https://www.annesdrikkeleker.no/index.html/beste-drikkespill.html).
Regelvalg, kildehenvisninger og overlapp er dokumentert i
[SPILLREGLER.md](docs/SPILLREGLER.md). Uavkryssede beskrivelser er implementeringskrav, ikke ferdige spill.
Reglene er SipZone-varianter, ikke en påstand om ett offisielt regelsett.

### Først – én enhet og tydelig rundelogikk

Bussruta: se «Tilgjengelig nå» over for den gjeldende rombaserte varianten.

- [ ] **Rød eller svart:** bruk den felles 52-kortstokken, ett fargevalg per tur,
      korrekt fargeklassifisering, poeng og tydelig avslutning ved tom stokk.
- [ ] **Gjett kortet / Fuck the Dealer:** skjult kort, to gjetninger med
      høyere/lavere-hint, navngitt dealer, eksplisitt regel for dealerbytte og
      resultat før noen får se neste kort. Avtal essrangering i oppsettet.
- [ ] **21-leken:** valg av ett til tre tall per tur, retningsendringer og
      synlig liste med aktive tallregler. Avvis turer som går forbi 21, og gjør
      omstart, feilregistrering og hvem som lager ny regel entydig.
- [ ] **Hva vil du helst?:** egne norske dilemmaer, to valg og samtidig
      avsløring. Start med felles skjerm; Live kan få private stemmer senere.
      Håndter lik fordeling og at alle velger samme alternativ.
- [ ] **Paranoia:** privat spørsmål til en navngitt spiller, svar i form av
      en annen deltaker, skjult overlevering og valgfri avsløring. Spørsmålet
      må skjules før mobilen går videre. Bruk egne spørsmål.

### Deretter – kort, bløff og gjetting

- [ ] **Pyramiden:** skjulte hender, pyramide som avdekkes radvis, påstander,
      bløffrop og et tydelig avsløringssteg. Test kortbudsjett, erstatningskort
      og tom trekkbunke. Del senere kortkomponenter med Bussruta.
- [ ] **Hesteveddeløp:** fire ess som løpere, fargevalg før start, trekk uten
      tilbakelegging og animert fremdrift. Bestem banelengde og poengmodell;
      vis vinner og håndter tom stokk uten endeløs venting.
- [ ] **Mexicaner / Mia:** private terningkast, eksakt rangering, stigende bud,
      tro eller utfordre, avsløring og riktig ny starter. Start på én enhet
      med skjult overlevering. Test alle 36 terningkombinasjoner.
- [ ] **Terningleken:** virtuell terning og et regelkort per resultat,
      turrotasjon, synlige husregler og slutt etter valgt rundetall. Terningens
      visning må stemme med resultatet; vurder Tre mann som senere regelpakke.
- [ ] **To sannheter og en løgn:** spilleren skriver tre egne påstander og
      markerer løgnen i skjul. De andre gjetter før fasit vises. Unngå å vise
      riktig svar ved overlevering; håndter stemmelikhet og poeng eksplisitt.
- [ ] **Bølgelengde:** egen SipZone-variant med et privat tall på en skala,
      bekreftet overlevering, gjetning og poeng etter avstand. Egne temaer,
      vekslende roller og ingen avsløring av tallet før gjetningen låses.

## TODO – flere romspill med eksisterende kode

- [ ] **Hvem er spionen?:** gjennomgå roller, spørsmål, gjetting og avstemming.
- [ ] **Varulv:** gjennomgå natt/dag, private roller og vilkår for seier.
- [ ] **Snyd:** gjennomgå private hender, bud, bløffrop og tom hånd.
- [ ] **Løgnerdyst:** gjennomgå terningbud, avsløring og eliminering.
- [ ] **To sannheter og en løgn (Live):** gjennomgå innskriving, privat fasit og avstemming.

## Felles videre arbeid

- [ ] Publisering: opprett Pages-prosjektet, sett romserverens `AUTH_SECRET`
      til samme verdi som huben, publiser romserveren og koble domenerouteren.
- [ ] Hub-integrasjon: spillkort, illustrasjon, tekst og lenke til `/sipzone/`.
- [ ] Redaksjonell gjennomgang og større innholdspakker for spørsmål og oppgaver.
- [ ] Full engelsk oversettelse av spillinnhold og regler. Felles navigasjon,
      konto og sentrale kontroller støtter allerede norsk og engelsk.
- [ ] Flere variasjoner i Hot Potatos oppgaver og Sip Roulettes felt.
- [ ] Flere valgbare husregelsett i Card of Fate. Digital registrering av
      makkerpar er implementert; hvert nytt valg erstatter tidligere par.
- [ ] Live: egen spillerklar-status, fjerning av inaktive deltakere og
      mulighet for vertsoverføring uten at verten forlater rommet.
- [ ] Live-moduler med private roller og svar: egne visningsmodeller og tester
      før de innføres. MVP-en sender bare gjeldende spørsmål og anonyme resultater.
- [ ] Vurder lagring av økter/profil ved konkret behov. Lokale runder og navn
      er foreløpig bare i minnet, og gir ingen personlig XP eller ledertavler.

Status: **ett tilgjengelig spill (H-en + Bussruta)**. Alle andre spill er **TODO**.
