# Spillregler og inspirasjon

Gjennomgått 19. oktober 2026. Utgangspunktet er
[Drikkespill.no](https://drikkespill.no/) og
[Annes oversikt over drikkespill](https://www.annesdrikkeleker.no/index.html/beste-drikkespill.html).
Sidene bruker ulike varianter. SipZone velger derfor konkrete regler som vises
før start og gjelder gjennom hele økten. Vi bruker egne tekster og oppgaver.

## Endringer som er implementert

### Higher or Lower

[Drikkespills regelbeskrivelse](https://drikkespill.no/drikkeleker/hoyere-eller-lavere)
beskriver en rekke som spilleren kan stoppe, og en poengvariant med sikring.
SipZone har nå begge spillemåter: rask modus med én gjetning per tur, og
rekkemodus der samme spiller kan fortsette. Riktige svar bygger en usikret
pott; stopp sikrer den, mens feil bare fjerner den usikrede potten. Ingen
poeng deles ut som slurker i rekkemodusen.

Oppsettet lar gjengen velge ess høyt/lavt og like kort som feil/trygt.
Standardinnstillingene fra første versjon beholdes. Et trygt likt kort bygger
ikke rekken. Stokken brukes uten tilbakelegging, også over turbytter. Dersom
siste kort lar rekken stå, sikres den før spillet avsluttes. Rundetallet er
antall spillerturer; en aktiv rekke avbrytes ikke midt i turen av rundetallet.

### Category Rush

[Reglene til Kategorileken](https://drikkespill.no/drikkeleker/kategorileken)
ga grunnlag for å la taperen velge neste kategori og åpne for egne kategorier.
Velgeren starter selv og kan gi valget videre før tidtakeren starter. Appen
foreslår ubrukte kategorier og avviser gjenbruk, også ved ulik tegnsetting.
Fem sekunder er standard; ti og femten er fortsatt tilgjengelig i oppsettet.

Gjengen registrerer gjentakelse, svar utenfor kategorien eller stopp. En ny
spiller får en ny tidsfrist, men et sent trykk kan ikke redde forrige spiller.
Appen erstatter ikke gruppens vurdering av muntlige svar. Ved tvil avgjør de
andre med håndsopprekking, og likt stemmetall godkjenner svaret.

### Card of Fate

[Ring of Fire-beskrivelsen](https://drikkespill.no/drikkeleker/ring-of-fire)
bruker makker som en vedvarende rolle. SipZones åttere registrerer nå et
synlig, gjensidig makkerpar som varer videre i økten. Hver spiller kan ha én
makker. Et nytt par frigjør de to spillernes tidligere makkere. Spilleren kan
hoppe over kortet og beholde tidligere par. En makkerslurk utløser ingen kjede.

Dette er vårt regelvalg. De øvrige kortene beholder SipZones eksisterende
betydning, og fjerde konge avslutter fortsatt spillet med husregler.

### Bussruta

Bussruta er nå implementert som SipZones variant for én enhet og 2–8 spillere.
Regelvalg som skilte seg mellom kildene er fastlagt slik:

- Én kortstokk gir fire kort per spiller og 15 pyramidekort. Med åtte spillere
  brukes 47 unike kort. Ingen nye stokker blandes inn i utdeling eller pyramide.
- Hver spiller får fire private gjetninger: farge, høyere/lavere, innenfor/utenfor
  og sort. Ess er høyest. Lik verdi er feil; også likt med en av grensene i
  innenfor/utenfor. Riktig gir ett poeng, feil én valgfri slurk.
- Hånden vises først etter bekreftet overlevering. De andre ser bort. Spilleren
  skjuler hånden før neste person får mobilen. Ved senere innsyn gjelder samme
  overlevering; appen viser ikke hvem som har matchende kort på felles skjerm.
- Pyramiden snus fra nederste rad, fem/fire/tre/to/ett kort. Et matchende
  håndkort legges én gang og gir radens poeng (1–5). Spilleren kan velge én
  annen deltaker til én valgfri slurk eller hoppe over utdelingen. Flere kort
  kan legges før gruppen avslutter samme pyramidekort. Dette er en poengvariant;
  radnummeret øker ikke antall slurker.
- Den med flest restkort kjører, uavhengig av poeng. Ved delt tap trekker appen
  én av kandidatene tilfeldig. Er alle tomhendte, avsluttes spillet uten busstur.
- Bussturen har fem kort og fire høyere/lavere-gjetninger. Ved feil begynner
  et nytt forsøk fra første kort, med fem kort fra en ny stokket kortstokk.
  Kort kan derfor komme igjen mellom forsøk, men ikke innenfor ett forsøk.
  Ess er høyest og like verdier er feil. Etter tre mislykkede forsøk er turen
  slutt. Sjåføren kan også avslutte underveis uten en ny feilregistrering.

## Overlapp og nye leker

Annes oversikt bruker norske navn på flere mekanikker som allerede finnes her.
Vi beholder derfor én oppføring per lek:

| Navn i oversiktene                  | SipZone                                                       |
| ----------------------------------- | ------------------------------------------------------------- |
| Jeg har aldri                       | Never Have I Ever                                             |
| Pekelek / Mest sannsynlig           | Who’s Most Likely?                                            |
| Flasketuten peker på / Snurr flaska | Spin the Bottle                                               |
| Samtalekort                         | Truth Train dekker allerede personlige spørsmål og oppfølgere |
| Ring of Fire                        | Card of Fate med SipZones regelvalg                           |

Tolv nye leker ble lagt i TODO med egne krav til tilstand, avsløring og
avslutning. Bussruta er nå implementert; de elleve andre er fortsatt planlagt. Dette er vår prioritering av hva som passer digitalt, ikke en
rangering hentet fra kildene. Fysiske leker som Beer Pong og Flip Cup er ikke
lagt inn som digitale spill i denne gjennomgangen.

- **Bussjåfør/Bussruta:** [Drikkespills faser](https://drikkespill.no/drikkeleker/bussjafor)
  og [Annes spillflyt](https://www.annesdrikkeleker.no/index.html/bussruta.html)
  er ulike oppsett. SipZones kortbudsjett, private hender, poengmodell og
  sluttvilkår er fastlagt i Bussruta-avsnittet over.
- **Kortleker:** [Rød eller svart](https://drikkespill.no/drikkeleker/rod-eller-svart),
  [Gjett kortet hos Anne](https://www.annesdrikkeleker.no/index.html/fuckthedealer.html),
  [Pyramiden](https://drikkespill.no/drikkeleker/pyramiden) og
  [Hesteveddeløp](https://drikkespill.no/drikkeleker/hesteveddelop) passer
  den eksisterende kortstokken, men trenger hver sin rundelogikk.
- **Sosialt og uten kort:** 21-leken, Paranoia, Hva vil du helst?, Mexicaner,
  Terningleken og To sannheter og en løgn finnes i Drikkespills oversikt.
  TODO beskriver vår foreslåtte digitale tilpasning, med egne innholdspakker.
- **Bølgelengde:** inspirert av den private skalaen i
  [Annes Wavelength](https://www.annesdrikkeleker.no/index.html/wavelength.html).
  SipZone planlegger egne temaer og poeng etter avstand, med skjult verdi frem
  til gjetningen er låst.

Karaoke foreslås i Annes oversikt. Lyd og sangtekster trenger en avklart
innholdsmodell; dette beholdes som vurdering sammen med Finish the Lyric.
Spørsmål, oppgavetekster, illustrasjoner og kildekode fra sidene kopieres ikke.
