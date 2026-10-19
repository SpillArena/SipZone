import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/archivo";
import "../../src/ui/arena.css";
import "../../src/ui/settings.css";
import "../../src/styles.css";
import "../../src/live.css";
import "../../src/party-games.css";
import "../../src/bus.css";
import "../../src/mobile-games.css";
import "../../src/motion.css";
import { LIVE_GAMES } from "../../shared/live-games";
import { ConnectedRoom } from "../../src/features/live/ConnectedRoom";
import { games } from "../../shared/catalog";
import { createBusGame, playBus, type BusState } from "../../shared/bus";
import {
  applyRoomAction,
  createRoom,
  joinRoom,
  publicRoom,
} from "../../shared/rooms";
import { I18nProvider, useI18n } from "../../src/i18n";
import { LocalGame } from "../../src/features/LocalGame";
import { BusGame } from "../../src/games/BusRoute";
import { LiveBoard } from "../../src/features/live/LiveBoard";
import { Live } from "../../src/features/live/Live";
import { Home } from "../../src/features/Home";
import { Setup } from "../../src/features/Setup";
import { SiteHeader, SiteFooter, LobbyLink } from "../../src/ui/SiteShell";
import { SettingsMenu } from "../../src/ui/SettingsMenu";
import { AccountBadge } from "../../src/account";
import logo from "../../src/ui/sipzone-logo.svg";

const players = [
  "AlexandertheLongPlayer",
  "BenjaminWithALongName",
  "CharlotteWithALongName",
].map((name, index) => ({ id: String(index), name }));
const settings = {
  rounds: 5,
  cards: {
    mode: "streak" as const,
    ace: "high" as const,
    ties: "lose" as const,
  },
  level: "easy" as const,
  seconds: 10,
  category: "all" as const,
  voting: "secret" as const,
};
const busCases = [
  "h-intro",
  "h-covered",
  "h-open",
  "h-hand",
  "h-award",
  "tie",
  "guess-1",
  "guess-2",
  "guess-3",
  "guess-4",
  "guess-correct",
  "guess-wrong",
  "pyramid-ready",
  "pyramid-pick",
  "pyramid-fail",
  "pyramid-shot",
  "pyramid-done",
];
const roomCases = [
  "room-lobby",
  ...LIVE_GAMES.map((game) => `room-${game.id}`),
  "room-most-likely-results",
];
const cases = [
  ...roomCases,
  "home",
  "setup",
  ...games.filter((game) => game.id !== "bus").map((game) => game.id),
  ...busCases,
  "live-bus-pyramid-fail",
  "live-bus-pyramid-shot",
  "live-bus-pyramid-safe",
  "live-bus-finished",
  "live-bus-guess-1",
  "live-bus-guess-2",
  "live-bus-guess-3",
  "live-bus-guess-4",
  ...["higher-lower", "emoji", "quickfire", "roulette", "hot-potato"].map(
    (id) => `live-${id}`,
  ),
];
const params = new URLSearchParams(location.search);
const selected = params.get("case");
function busFixture(name: string): BusState {
  const state = createBusGame(players, () => 0.4);
  state.phase = "h";
  state.hands = state.guessHands.map((hand) => [...hand]);
  if (name === "h-intro") return state;
  state.table.index = 0;
  state.table.stage = "covered";
  if (name === "h-covered") return state;
  state.table.stage = "open";
  if (name === "h-open") return state;
  if (name === "h-hand") {
    state.table.stage = "hand";
    state.table.viewer = 0;
    return state;
  }
  if (name === "h-award") {
    state.table.index = 1;
    state.table.stage = "award";
    state.table.viewer = 0;
    state.table.actor = 0;
    return state;
  }
  state.phase = "driver";
  state.driverCandidates = [0, 2];
  if (name === "tie") return state;
  state.phase = "deal";
  state.drivers = [0, 2];
  state.deal.stage = "guess";
  state.deal.question =
    name.startsWith("guess-") && /[1-4]$/.test(name)
      ? Number(name.at(-1)) - 1
      : 3;
  if (name === "guess-correct" || name === "guess-wrong") {
    state.deal.stage = "feedback";
    state.deal.correct = name === "guess-correct";
  }
  if (name.startsWith("guess")) return state;
  state.phase = "bus";
  if (name === "pyramid-ready") return state;
  state.bus.stage = "pick";
  if (name === "pyramid-pick") return state;
  state.bus.stage = "feedback";
  state.bus.failed = true;
  state.bus.picks = [0];
  state.pyramid[0] = { rank: 12, suit: "♥" };
  if (name === "pyramid-fail") return state;
  state.bus.row = 5;
  state.bus.picks = [0, 5, 9, 12, 14];
  state.pyramid[14] = { rank: 13, suit: "♠" };
  if (name === "pyramid-shot") return state;
  state.phase = "done";
  state.endReason = "cleared";
  state.bus.failed = false;
  state.pyramid[14] = { rank: 1, suit: "♠" };
  return state;
}
function ReviewBus({ name }: { name: string }) {
  const [state, setState] = useState(() => busFixture(name));
  return (
    <section className="play-page arena-container play-bus">
      <BusGame
        state={state}
        act={(action) => setState((current) => playBus(current, action))}
        onFinish={() => {}}
      />
    </section>
  );
}
function ReviewLive({ name }: { name: string }) {
  const [room, setRoom] = useState(() => {
    const current = createRoom("123A", players[0].name);
    players.slice(1).forEach((player) => joinRoom(current, player.name, ""));
    applyRoomAction(current, current.members[0], {
      action: "settings",
      game: name.startsWith("bus-") ? "bus" : name,
      category: "all",
      version: current.version,
    });
    applyRoomAction(current, current.members[0], {
      action: "start",
      version: current.version,
    });
    if (name.startsWith("bus-pyramid-") && current.bus) {
      current.bus.phase = "bus";
      current.bus.phaseIntro = null;
      current.bus.drivers = [0];
      const row = name.endsWith("safe") ? 1 : name.endsWith("shot") ? 5 : 3;
      current.bus.bus = {
        ...current.bus.bus,
        row,
        stage: "pick",
        picks: row === 5 ? [0, 5, 9, 12] : row === 1 ? [] : [0, 5],
      };
      current.bus.pyramid[row === 5 ? 14 : 9] = { rank: 12, suit: "♥" };
      if (name.endsWith("safe"))
        current.bus.pyramid = current.bus.pyramid.map(() => ({
          rank: 1,
          suit: "♣",
        }));
    }
    if (name === "bus-finished" && current.bus) {
      current.bus.phase = "done";
      current.bus.phaseIntro = null;
      current.bus.endReason = "cleared";
      current.bus.drivers = [0];
      current.bus.bus = { ...current.bus.bus, attempt: 3, failures: 2 };
    }
    if (name.startsWith("bus-guess-") && current.bus) {
      current.bus.phaseIntro = null;
      current.bus.deal.question = Number(name.at(-1)) - 1;
      const question = current.bus.deal.question;
      current.bus.hands[0] = current.bus.guessHands[0].slice(0, question);
    }
    return current;
  });
  return (
    <section className="live-page arena-container page-narrow live-playing">
      <LiveBoard
        room={publicRoom(room, room.members[0].id)}
        disabled={false}
        send={async (input) => {
          const next = structuredClone(room);
          applyRoomAction(next, next.members[0], {
            ...input,
            round: room.round,
            version: room.version,
          });
          setRoom(next);
          return true;
        }}
      />
    </section>
  );
}
// Only this isolated review page replaces the room transport. No server calls
// or credentials are needed to render the real lobby and all nine Live games.
function prepareRoomFixture(name: string) {
  const room = createRoom("123A", players[0].name);
  for (let index = 1; index < 16; index++)
    joinRoom(
      room,
      `${players[index % players.length].name.slice(0, 20)}${index}`,
      "",
    );
  if (name !== "room-lobby") {
    const game = name.replace(/^room-/, "").replace(/-results$/, "");
    applyRoomAction(room, room.members[0], {
      action: "settings",
      game,
      category: "all",
      version: room.version,
    });
    applyRoomAction(room, room.members[0], {
      action: "start",
      version: room.version,
    });
    if (name.endsWith("-results")) {
      for (const member of room.members)
        applyRoomAction(room, member, {
          action: "vote",
          target: room.members[1].id,
          round: room.round,
        });
      applyRoomAction(room, room.members[0], {
        action: "reveal",
        version: room.version,
      });
    }
  }
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    if (!String(input).includes("/api/rooms/123A"))
      return originalFetch(input, init);
    const body = init?.body ? JSON.parse(String(init.body)) : null;
    if (body?.action === "ticket")
      return Response.json({ ticket: "local-review" });
    if (body) applyRoomAction(room, room.members[0], body);
    return Response.json(publicRoom(room, room.members[0].id));
  };
  class ReviewSocket {
    static OPEN = 1;
    readyState = 1;
    onopen: (() => void) | null = null;
    onmessage: ((event: { data: string }) => void) | null = null;
    onclose: ((event: { code: number }) => void) | null = null;
    onerror: (() => void) | null = null;
    constructor() {
      queueMicrotask(() => this.onopen?.());
    }
    send() {
      /* Local room data is refreshed through the mocked fetch. */
    }
    close() {
      this.readyState = 3;
    }
  }
  window.WebSocket = ReviewSocket as unknown as typeof WebSocket;
  return { code: "123A", token: "local-review", account: players[0].name };
}
const roomAccess =
  selected && roomCases.includes(selected)
    ? prepareRoomFixture(selected)
    : null;

function Fixture({ name }: { name: string }) {
  const { setTheme } = useI18n();
  useEffect(() => {
    if (params.get("theme") === "light") setTheme("light");
  }, [setTheme]);
  return (
    <div className="app-shell">
      <SiteHeader name="SipZone" logo={logo}>
        <LobbyLink language="no" />
        <AccountBadge corner="header" language="no" />
        <SettingsMenu />
      </SiteHeader>
      <main>
        {roomAccess ? (
          <ConnectedRoom access={roomAccess} onLeave={() => {}} />
        ) : name === "home" ? (
          <Home />
        ) : name === "setup" ? (
          <Setup
            game={games.find((game) => game.id === "bus")!}
            party={players}
            onStart={() => {}}
          />
        ) : name === "live" ? (
          <Live initialCode="join" />
        ) : name.startsWith("live-") ? (
          <ReviewLive name={name.slice(5)} />
        ) : busCases.includes(name) ? (
          <ReviewBus name={name} />
        ) : (
          <LocalGame
            game={games.find((game) => game.id === name)!}
            players={players}
            settings={settings}
            onExit={() => {}}
            onReplay={() => {}}
            onComplete={() => {}}
          />
        )}
      </main>
      <SiteFooter game="SipZone" language="no" />
    </div>
  );
}
function measure() {
  const width = innerWidth;
  const hasScrollableAncestor = (element: Element) => {
    let parent = element.parentElement;
    while (parent && parent !== document.body) {
      const style = getComputedStyle(parent);
      if (["auto", "scroll", "hidden", "clip"].includes(style.overflowX))
        return true;
      parent = parent.parentElement;
    }
    return false;
  };
  const outside = [
    ...document.querySelectorAll(
      "main button, main input, main h1, main h2, main h3, .arena-header, .playing-card, .quick-options, .turn-banner, .game-actions",
    ),
  ]
    .filter((element) => {
      const rect = element.getBoundingClientRect();
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        (rect.right > width + 2 || rect.left < -2) &&
        !hasScrollableAncestor(element)
      );
    })
    .map(
      (element) =>
        `${element.tagName}.${element.className}: ${Math.round(element.getBoundingClientRect().left)}–${Math.round(element.getBoundingClientRect().right)}`,
    );
  const overlap: string[] = [];
  for (const action of document.querySelectorAll(".game-actions"))
    for (const content of document.querySelectorAll(
      ".prompt-card, .higher-cards, .fate-layout, .quick-options, .bottle-roster, .bus-hand, .bus-h, .bus-pyramid",
    )) {
      if (action.contains(content) || content.contains(action)) continue;
      const a = action.getBoundingClientRect(),
        b = content.getBoundingClientRect();
      if (
        a.width &&
        b.width &&
        Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 &&
        Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2
      )
        overlap.push(`${action.className} / ${content.className}`);
    }
  return {
    outside,
    overlap,
    pageOverflow: document.documentElement.scrollWidth > width + 2,
  };
}
function Suite() {
  const [results, setResults] = useState<
    {
      name: string;
      width: number;
      height: number;
      theme: string;
      outside: string[];
      overlap: string[];
      pageOverflow: boolean;
    }[]
  >([]);
  const [index, setIndex] = useState(0);
  const widths = [
    [320, 568],
    [375, 812],
    [430, 932],
    [812, 375],
    [1280, 800],
  ];
  const jobs = (params.get("scope") === "rooms" ? roomCases : cases)
    .flatMap((name) =>
      widths.map(([width, height]) => ({ name, width, height, theme: "dark" })),
    )
    .concat(
      (params.get("scope") === "rooms"
        ? []
        : [
            "h-hand",
            "guess-4",
            "pyramid-pick",
            "roulette",
            "emoji",
            "live-quickfire",
          ]
      ).map((name) => ({ name, width: 375, height: 812, theme: "light" })),
    );
  const job = jobs[index];
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (
        event.origin !== location.origin ||
        event.data?.kind !== "sipzone-layout"
      )
        return;
      setResults((current) => [
        ...current,
        { ...jobs[index], ...event.data.report },
      ]);
      setIndex(index + 1);
    };
    addEventListener("message", receive);
    return () => removeEventListener("message", receive);
  }, [index]);
  const failures = results.filter(
    (result) =>
      result.pageOverflow || result.outside.length || result.overlap.length,
  );
  return (
    <main style={{ padding: 24, maxWidth: 1000, margin: "auto" }}>
      <h1 style={{ fontSize: 32 }}>SipZone mobile layout review</h1>
      <p role="status">
        {results.length} / {jobs.length} checks complete · {failures.length}{" "}
        failures
      </p>
      <p>
        Real components; long player names; 320, 375, 430, landscape 812 × 375
        and desktop 1280. Live boards use local room fixtures, without a server
        connection.
      </p>
      <p>Open a case for visual and interactive review:</p>
      <select
        aria-label="Review case"
        defaultValue=""
        onChange={(event) => (location.search = `?case=${event.target.value}`)}
      >
        <option value="" disabled>
          Choose case
        </option>
        {cases.map((name) => (
          <option key={name}>{name}</option>
        ))}
      </select>
      <h2>Failures</h2>
      {failures.map((result, i) => (
        <pre key={i} style={{ whiteSpace: "pre-wrap" }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      ))}
      {!failures.length && <p>None found.</p>}
      <h2>Available review cases</h2>
      <p>{cases.join(" · ")}</p>
      {job && (
        <iframe
          title="Layout check"
          key={index}
          src={`?case=${job.name}&report=1&theme=${job.theme}`}
          style={{
            position: "absolute",
            left: -20000,
            top: 0,
            width: job.width,
            height: job.height,
            border: 0,
          }}
        />
      )}
    </main>
  );
}
createRoot(document.getElementById("root")!).render(
  <I18nProvider>
    {selected ? <Fixture name={selected} /> : <Suite />}
  </I18nProvider>,
);
if (selected && params.has("report")) {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await document.fonts.ready;
  requestAnimationFrame(() =>
    requestAnimationFrame(() =>
      setTimeout(
        () =>
          parent.postMessage(
            { kind: "sipzone-layout", report: measure() },
            location.origin,
          ),
        80,
      ),
    ),
  );
}
