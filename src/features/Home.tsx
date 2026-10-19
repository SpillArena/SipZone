import { useEffect, useRef } from "react";
import { ArrowUpRight, Clock3, Users, Smartphone } from "lucide-react";
import { games, needsOwnPhones } from "../../shared/catalog";
import { useI18n } from "../i18n";
import { GameArt } from "../ui/GameArt";
import tableArt from "../assets/vorsbord.svg";
export type GameFilter = "all" | "local" | "live";
export function Home({
  filter,
  onFilter,
}: {
  /** Set by the address, so the header's shortcuts and these filters agree. */
  filter: GameFilter;
  onFilter: (filter: GameFilter) => void;
}) {
  const { t } = useI18n();
  // a tap on the page's own filters is already in view; only arrivals scroll
  const quiet = useRef(false);
  const mounted = useRef(false);
  useEffect(() => {
    const first = !mounted.current;
    mounted.current = true;
    if (quiet.current) {
      quiet.current = false;
      return;
    }
    if (filter === "all") return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("lekene")?.scrollIntoView({
      block: "start",
      behavior: first || reduce ? "instant" : "smooth",
    });
  }, [filter]);
  const setFilter = (next: GameFilter) => {
    quiet.current = true;
    onFilter(next);
  };
  const groups: {
    id: Exclude<GameFilter, "all">;
    many: boolean;
    title: string;
    text: string;
    games: typeof games;
  }[] = [
    {
      id: "local",
      many: false,
      title: t("Én mobil på bordet", "One phone on the table"),
      text: t(
        "Ett felles objekt, som hjulet, flasken, poteten eller kortet som leses høyt. Legg mobilen midt på bordet eller send den rundt.",
        "One shared object, like the wheel, the bottle, the potato or the card read out loud. Put the phone in the middle or pass it around.",
      ),
      games: games.filter((game) => !needsOwnPhones(game)),
    },
    {
      id: "live",
      many: true,
      title: t("Hver sin mobil", "A phone each"),
      text: t(
        "Alle sitter med egne kort eller svarer i skjul. Hver spiller trenger sin egen mobil og en SpillArena-konto.",
        "Everyone holds their own cards or answers in secret. Every player needs their own phone and a SpillArena account.",
      ),
      games: games.filter(needsOwnPhones),
    },
  ];
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
                {t("Spill på én mobil", "Play on one phone")}
                <ArrowUpRight size={20} />
              </a>
            </div>
            <p className="hero-note">
              {t(
                "Én oppretter rommet. Resten blir med med kode eller lenke.",
                "One creates a room. Everyone else joins with a code or link.",
              )}{" "}
              <a className="live-join-link" href="#/live/join">
                {t("Har du en kode? Bli med →", "Got a code? Join →")}
              </a>
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
            {
              id: "all" as GameFilter,
              label: t("Alle leker", "All games"),
              count: games.length,
            },
            ...groups.map((group) => ({
              id: group.id,
              label: group.many
                ? t("Hver sin mobil", "A phone each")
                : t("Én mobil", "One phone"),
              count: group.games.length,
            })),
          ].map((item) => (
            <button
              key={item.id}
              className="filter"
              aria-pressed={filter === item.id}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
              <span>{item.count}</span>
            </button>
          ))}
        </div>
        {groups
          .filter((group) => filter === "all" || filter === group.id)
          .map((group) => (
            <section
              key={group.id}
              className="game-group"
              aria-labelledby={`group-${group.id}`}
            >
              <div className="game-group-heading">
                <Devices many={group.many} />
                <div>
                  <h3 id={`group-${group.id}`}>{group.title}</h3>
                  <p>{group.text}</p>
                </div>
              </div>
              <div className="game-grid">
                {group.games.map((game) => (
                  <a key={game.id} className="game-tile" href={`#/${game.id}`}>
                    <GameArt id={game.id} />
                    <Devices many={group.many} label />
                    <div className="tile-copy">
                      <p className="tile-kicker">{game.subtitle}</p>
                      <h4>{game.name}</h4>
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
          ))}
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
