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

Gjeldende SipZone-variant er for 2–8 spillere med hver sin mobil:

Før hver av de tre fasene får alle en animert intro med enkle regler.
Hver spiller trykker «Jeg er klar» på sin egen enhet. Fasen begynner først når
alle er klare; etter pyramideintroen kan de på bussen velge første kort direkte.

1. **Fire gjetninger:** alle gjetter ett kort hver på rundgang. Rød/svart,
   høyere/lavere, innenfor/utenfor og sort. Riktig svar gir bort 1–4 slurker;
   feil svar gir samme antall til spilleren selv. Ess er høyest, likt er feil,
   og innenfor/utenfor bruker strenge grenser. Kortet beholdes uansett svar.
   Ved feil svar bekrefter spilleren å ha drukket. Ved riktig svar vises
   mottakervalg etter to sekunder. Turen går først videre når den som skal
   drikke har trykket «Jeg har drukket». Varsler varer høyst ti sekunder, kan lukkes og forsvinner når
   drikkingen bekreftes; selve bekreftelsen har ingen tidsfrist og kan ikke hoppes over.
2. **H-en:** de samme fire kortene blir hånden. H-ens 12 kort kommer fra resten
   av samme stokk, slik at ingen kort finnes både på hånden og på bordet.
   Verten snur høyre/venstre annenhver gang. Match til venstre gir bort en
   slurk, match til høyre tar en slurk, og de to kortene i midten gir en shot.
   Et trykk på et spillbart håndkort velger sist snudde match automatisk.
3. **Pyramiden:** den med flest kort igjen tar bussen. Ved likt avgjør dere med
   stein, saks, papir, eller tar bussen sammen. Ingen kort igjen betyr ingen
   busstur. Det er ingen ny gjetterunde etter H-en. Velg ett kort per rad i
   pyramiden og unngå knekt, dame og konge; ess er trygt. Bildekort gir 2, 4,
   6 eller 8 slurker på rad 1–4 og en shot på toppen. Et bildekort stokker hele
   pyramiden og starter fra bunnen igjen, uten en fast grense på antall forsøk.
   Trygge kort aktiverer neste rad automatisk. Ved bildekort vises kortet og
   resettingen før drikkevinduet åpnes etter tre sekunder. Vinduet viser kortet
   som ble truffet. Når alle på bussen har bekreftet, starter neste forsøk automatisk.

Dette er SipZones avtalte variant. Historiske kildehenvisninger nedenfor er
inspirasjon; den gjeldende digitale flyten er beskrevet her og i spillet.

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
