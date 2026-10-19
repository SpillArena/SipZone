import { useEffect, useState } from "react";
import { AccountBadge, ConsentDialog } from "./account";
import { useI18n } from "./i18n";
import { gameById } from "../shared/catalog";
import { isLiveGame } from "../shared/live-games";
import type { Player } from "../shared/engine";
import { SiteFooter, SiteHeader, LobbyLink } from "./ui/SiteShell";
import { SettingsMenu } from "./ui/SettingsMenu";
import { Dialog } from "./ui/Dialog";
import logo from "./ui/sipzone-logo.svg";
import { Home, type GameFilter } from "./features/Home";
import { Setup } from "./features/Setup";
import type { GameSettings } from "./features/Setup";
import { LocalGame } from "./features/LocalGame";
import { Live } from "./features/live/Live";
const routeFromHash = () => location.hash.replace(/^#\/?/, "").split("/");
/** The front page, opened on one kind of game: one phone or a phone each. */
const FILTER_ROUTES: Record<string, GameFilter> = {
  "en-mobil": "local",
  "hver-sin-mobil": "live",
};
const filterHash = (filter: GameFilter) =>
  filter === "all"
    ? "#/"
    : `#/${Object.keys(FILTER_ROUTES).find((key) => FILTER_ROUTES[key] === filter)}`;
interface Session {
  id: string;
  game: string;
  settings: GameSettings;
  finished: boolean;
}
export default function App() {
  const { language, t } = useI18n();
  const [route, setRoute] = useState(routeFromHash);
  const [party, setParty] = useState<Player[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [exit, setExit] = useState(false);
  const game = gameById(route[0]);
  const filter: GameFilter | undefined = !route[0]
    ? "all"
    : FILTER_ROUTES[route[0]];
  const active = session && !session.finished;
  const home = () => {
    setSession(null);
    setExit(false);
    if (location.hash === "#/" || !location.hash) {
      setRoute([]);
      window.scrollTo(0, 0);
    } else location.hash = "/";
  };
  useEffect(() => {
    const change = () => {
      if (
        active &&
        !window.confirm(
          t(
            "Avslutte leken? Denne runden blir ikke lagret.",
            "Finish this game? The current round will not be saved.",
          ),
        )
      ) {
        history.replaceState(null, "", `#/${session.game}`);
        return;
      }
      setSession(null);
      const next = routeFromHash();
      setRoute(next);
      // the front page scrolls itself to the chosen kind of game
      if (!FILTER_ROUTES[next[0]]) window.scrollTo(0, 0);
    };
    addEventListener("hashchange", change);
    return () => removeEventListener("hashchange", change);
  }, [active, session, t]);
  useEffect(() => {
    if (!active) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    addEventListener("beforeunload", warn);
    return () => removeEventListener("beforeunload", warn);
  }, [active]);
  useEffect(() => {
    document.title = game
      ? `${game.name} · SipZone`
      : "SipZone · Gode venner. Dårlige unnskyldninger.";
  }, [game]);
  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        {t("Hopp til innhold", "Skip to content")}
      </a>
      <SiteHeader
        name="SipZone"
        logo={logo}
        language={language}
        onHome={(event) => {
          event.preventDefault();
          if (active) setExit(true);
          else home();
        }}
      >
        <LobbyLink language={language} />
        <AccountBadge corner="header" language={language} />
        <SettingsMenu />
      </SiteHeader>
      <main id="main" tabIndex={-1}>
        {filter ? (
          <Home
            filter={filter}
            onFilter={(next) => {
              // a filter tap on the page itself: keep the address in step
              // without the jump to the top a hash change brings
              history.replaceState(null, "", filterHash(next));
              setRoute(routeFromHash());
            }}
          />
        ) : !game ? (
          <section className="arena-container page-narrow not-found">
            <h1>
              {t("Den leken fant vi ikke.", "We couldn’t find that game.")}
            </h1>
            <a className="button primary" href="#/">
              {t("Til alle leker", "All games")}
            </a>
          </section>
        ) : game.kind === "live" ? (
          <Live
            key={`${game.id}-${route[1] ?? ""}`}
            initialCode={route[1] ?? ""}
            game={isLiveGame(game.id) ? game.id : undefined}
          />
        ) : session?.game === game.id ? (
          <LocalGame
            key={session.id}
            game={game}
            players={party}
            settings={session.settings}
            onExit={() => {
              if (active) setExit(true);
              else home();
            }}
            onReplay={() =>
              setSession({
                ...session,
                id: crypto.randomUUID(),
                finished: false,
              })
            }
            onComplete={() => setSession({ ...session, finished: true })}
          />
        ) : (
          <Setup
            key={game.id}
            game={game}
            party={party}
            onStart={(players, settings) => {
              setParty(players);
              setSession({
                id: crypto.randomUUID(),
                game: game.id,
                settings,
                finished: false,
              });
              window.scrollTo(0, 0);
            }}
          />
        )}
      </main>
      <SiteFooter game="SipZone" language={language} />
      <ConsentDialog
        language={language}
        game="SipZone"
        items={[
          {
            no: {
              title: "Språk og utseende",
              body: "Husker språk og lys eller mørk visning. Spillerlisten og lokale runder blir bare i denne fanen.",
            },
            en: {
              title: "Language and appearance",
              body: "Remembers your language and light or dark appearance. Local players and rounds stay in this tab only.",
            },
          },
        ]}
      />
      {exit && (
        <Dialog
          title={t("Avslutte leken?", "Finish this game?")}
          onClose={() => setExit(false)}
        >
          <p className="muted">
            {t(
              "Denne runden blir ikke lagret. Gjengen følger med til neste lek.",
              "This round won’t be saved. Your players carry over to the next game.",
            )}
          </p>
          <div className="actions">
            <button className="button secondary" onClick={() => setExit(false)}>
              {t("Spill videre", "Keep playing")}
            </button>
            <button className="button primary" onClick={home}>
              {t("Avslutt leken", "Finish game")}
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
