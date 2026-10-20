import { ArrowUpRight, Clock3, Users, Smartphone } from "lucide-react";
import { availableGames } from "../../shared/catalog";
import { useI18n } from "../i18n";
import { GameArt } from "../ui/GameArt";
import tableArt from "../assets/vorsbord.svg";
export function Home() {
  const { t } = useI18n();
  return (
    <>
      <section className="hero-section arena-container">
        <div className="hero">
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
                "Kort på bordet. Gjengen samlet. Spill H-en + Bussruta med venner på hver deres mobil.",
                "Cards on the table. Friends around it. Play H-en + Bussruta together, each on your own phone.",
              )}
            </p>
            <div className="hero-actions">
              <a className="button primary" href="#/bus">
                <Smartphone size={18} />
                {t("Spill Bussruta", "Play Bussruta")}
                <ArrowUpRight size={20} />
              </a>
              <a className="button secondary" href="#/live/join">
                {t("Bli med i rom", "Join a room")}
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
              "H-en + Bussruta. 2–8 spillere, hver sin mobil.",
              "H-en + Bussruta. 2–8 players, a phone each.",
            )}
          </p>
        </div>
        <div className="game-grid">
          {availableGames.map((game) => (
            <a key={game.id} className="game-tile" href={`#/${game.id}`}>
              <GameArt id={game.id} />
              <Devices many label />
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
              t("Opprett et rom", "Create a room"),
              t(
                "Logg inn med SpillArena-kontoen din og åpne Bussruta.",
                "Sign in with your SpillArena account and open Bussruta.",
              ),
            ],
            [
              t("Samle gjengen", "Gather your friends"),
              t(
                "Del romkoden. Alle blir med fra sin egen mobil.",
                "Share the room code. Everyone joins on their own phone.",
              ),
            ],
            [
              t("Tøm hånden i H-en", "Empty your hand in the H"),
              t(
                "Fire gjetninger gir dere hånden til H-en. De med flest kort igjen tar bussen.",
                "Four guesses give you your hand for the H. Most cards left means a ride on the bus.",
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

/** One phone or a phone each, as an icon and, on the tiles, in words. */
function Devices({ many, label }: { many: boolean; label?: boolean }) {
  const { t } = useI18n();
  const text = many
    ? t("Hver sin mobil", "A phone each")
    : t("Én mobil", "One phone");
  return (
    <span
      className={`device-badge ${many ? "is-many" : "is-one"} ${label ? "tile-devices" : ""}`}
      title={text}
      aria-label={label ? text : undefined}
      aria-hidden={label ? undefined : true}
    >
      <span className="device-icons" aria-hidden="true">
        <Smartphone size={label ? 13 : 20} />
        {many && <Smartphone size={label ? 13 : 20} />}
      </span>
      {label && <span aria-hidden="true">{text}</span>}
    </span>
  );
}
