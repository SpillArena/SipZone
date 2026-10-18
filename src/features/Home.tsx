import { useState } from "react";
import {
  ArrowUpRight,
  Clock3,
  Users,
  Smartphone,
  Radio,
  Vote,
} from "lucide-react";
import { games } from "../../shared/catalog";
import { useI18n } from "../i18n";
import { GameArt } from "../ui/GameArt";
import tableArt from "../assets/vorsbord.svg";
export function Home() {
  const { t } = useI18n();
  const [filter, setFilter] = useState("all");
  const shown = games.filter(
    (game) =>
      filter === "all" ||
      (filter === "live" ? game.kind === "live" : game.kind !== "live"),
  );
  return (
    <>
      <section className="hero arena-container">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="status-dot" />
            {t(
              "Fra SpillArena. Til vorset.",
              "From SpillArena. For the pre-party.",
            )}
          </p>
          <h1>
            {t("Gode venner.", "Good friends.")}
            <br />
            {t("Dårlige", "Questionable")}
            <br />
            <span>{t("unnskyldninger.", "excuses.")}</span>
          </h1>
          <p className="hero-description">
            {t(
              "Kort på bordet. Gjengen samlet. Drikkelekene til vorset, hytteturen og den ene runden til.",
              "Cards on the table. Friends around it. Party games for the pre-party, cabin trip and one more round.",
            )}
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#/live">
              <Smartphone size={18} />
              {t("Spill på hver sin mobil", "Play on your own phones")}
              <ArrowUpRight size={20} />
            </a>
            <a
              className="button secondary"
              href="#lekene"
              onClick={(event) => {
                event.preventDefault();
                setFilter("local");
                document.getElementById("lekene")?.scrollIntoView({
                  behavior: matchMedia("(prefers-reduced-motion: reduce)")
                    .matches
                    ? "instant"
                    : "smooth",
                });
              }}
            >
              {t("Spill på én enhet", "Play on one device")}
              <ArrowUpRight size={20} />
            </a>
          </div>
          <p className="hero-note">
            {t(
              "Én oppretter rommet. Resten blir med med kode eller lenke.",
              "One creates a room. Everyone else joins with a code or link.",
            )}
          </p>
        </div>
        <div className="table-scene">
          <span className="scene-label">
            {t("BORDET ER DEKKET", "THE TABLE IS SET")}
          </span>
          <img
            src={tableArt}
            alt={t(
              "Kortstokk, ølglass og snusboks på et vorsbord",
              "Playing cards, a beer glass and a snus box on a party table",
            )}
            width="620"
            height="550"
          />
          <p className="scene-caption">
            ↳{" "}
            {t(
              "Ta med gjengen. Vi tar med kortene.",
              "Bring your friends. We’ll bring the cards.",
            )}
          </p>
        </div>
      </section>
      <section
        className="live-spotlight arena-container"
        aria-labelledby="live-spotlight-heading"
      >
        <div className="live-spotlight-card">
          <div className="live-spotlight-copy">
            <p className="eyebrow">
              <span className="live-dot" />
              SipZone Live · 2–16 {t("spillere", "players")}
            </p>
            <h2 id="live-spotlight-heading">
              {t("Hver sin mobil.", "Your own phone.")}
              <br />
              {t("Samme vors.", "One shared party.")}
            </h2>
            <p>
              {t(
                "Ingen mobil på rundgang. Få samme spørsmål, stem i skjul og se hvem gjengen velger. Verten tar dere videre.",
                "No phone to pass around. Get the same question, vote privately and see who your friends pick. The host takes you to the next round.",
              )}
            </p>
            <div className="live-perks">
              <span>
                <Smartphone size={16} />
                {t("Din egen skjerm", "Your own screen")}
              </span>
              <span>
                <Vote size={16} />
                {t("Private stemmer", "Private votes")}
              </span>
              <span>
                <Radio size={16} />
                {t("Spill sammen", "Play together")}
              </span>
            </div>
            <div className="actions">
              <a className="button live-start" href="#/live">
                {t("Opprett et rom", "Create a room")}
                <ArrowUpRight size={18} />
              </a>
              <a className="live-join-link" href="#/live/join">
                {t("Har du en kode? Bli med →", "Got a code? Join →")}
              </a>
            </div>
          </div>
          <div className="live-phone-scene" aria-hidden="true">
            <div className="live-phone phone-host">
              <span className="phone-top">
                SIPZONE LIVE <i />
              </span>
              <span className="phone-game">HVEM AV DERE?</span>
              <strong>
                Gjengens
                <br />
                største
                <br />
                optimist?
              </strong>
              <span className="phone-option">Emil</span>
              <span className="phone-option selected">
                Ada <span>✓</span>
              </span>
              <span className="phone-option">Siri</span>
            </div>
            <div className="live-phone phone-voter">
              <span className="phone-top">
                DIN SKJERM <i />
              </span>
              <span className="phone-vote-icon">✓</span>
              <strong>
                Stemmen
                <br />
                din er inne.
              </strong>
              <span className="phone-bottom">BARE DU VET HVEM.</span>
            </div>
            <span className="phone-connection">✳</span>
          </div>
        </div>
      </section>
      <div className="ticker" aria-hidden="true">
        <span>VORSET</span>
        <i>✳</i>
        <span>HYTTETUREN</span>
        <i>✳</i>
        <span>SPILLKVELDEN</span>
        <i>✳</i>
        <span>BARE ÉN RUNDE TIL</span>
      </div>
      <section
        className="games-section arena-container"
        id="lekene"
        aria-labelledby="games-heading"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">01 / {t("Lekeplassen", "The playground")}</p>
            <h2 id="games-heading">
              {t("Hva legger vi på bordet?", "What’s on the table?")}
            </h2>
          </div>
          <p className="muted small">
            {t(
              "Velg en lek. Resten tar vi underveis.",
              "Pick a game. We’ll take it from there.",
            )}
          </p>
        </div>
        <div
          className="filters"
          aria-label={t("Filtrer leker", "Filter games")}
        >
          {[
            { id: "all", label: t("Alle leker", "All games") },
            { id: "local", label: t("Én enhet", "One device") },
            { id: "live", label: t("SipZone Live", "SipZone Live") },
          ].map((item) => (
            <button
              key={item.id}
              className="filter"
              aria-pressed={filter === item.id}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
              <span>
                {
                  games.filter(
                    (game) =>
                      item.id === "all" ||
                      (item.id === "live"
                        ? game.kind === "live"
                        : game.kind !== "live"),
                  ).length
                }
              </span>
            </button>
          ))}
        </div>
        <div className="game-grid">
          {shown.map((game) => (
            <a key={game.id} className="game-tile" href={`#/${game.id}`}>
              <GameArt id={game.id} />
              <div className="tile-copy">
                <p className="tile-kicker">{game.subtitle}</p>
                <h3>{game.name}</h3>
                <p>{game.description}</p>
                <div className="tile-meta">
                  <span>
                    <Users size={13} />
                    {game.min}–{game.max ?? 16}
                  </span>
                  <span>
                    <Clock3 size={13} />
                    {game.time}
                  </span>
                  <ArrowUpRight size={20} className="tile-arrow" />
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>
      <section className="how-section arena-container">
        <div>
          <p className="eyebrow">
            02 / {t("Tanken er enkel", "Keep it simple")}
          </p>
          <h2>
            {t("Mindre oppsett.", "Less setup.")}
            <br />
            {t("Mer «din tur».", "More “your turn”.")}
          </h2>
        </div>
        <ol className="steps">
          {[
            [
              t("Finn en lek", "Pick a game"),
              t(
                "En kort forklaring, så skjønner alle greia.",
                "A quick explanation gets everyone ready.",
              ),
            ],
            [
              t("Samle gjengen", "Gather your friends"),
              t(
                "Legg til navnene deres. Konto trengs bare i Live.",
                "Add your names. Only Live requires an account.",
              ),
            ],
            [
              t("La det gå på rundgang", "Pass it around"),
              t(
                "Spill i deres eget tempo. Hopp over når dere vil.",
                "Play at your own pace. Skip whenever you want.",
              ),
            ],
          ].map(([title, text], index) => (
            <li key={title}>
              <span>{index + 1}</span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
