import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cardLabel, type Card, type Player } from "../../shared/engine";
import {
  H_CARD_COUNT,
  createBusGame,
  hEffect,
  playBus,
  pyramidPenalty,
  type BusAction,
  type BusState,
} from "../../shared/bus";
import { PlayingCard, TurnBanner } from "./GameControls";
import {
  HIDDEN_CARD,
  busPhase,
  effectLabels,
  guesses,
  questions,
  sips,
} from "./bus-copy";

export function Actions({ children }: { children: ReactNode }) {
  return <div className="actions centered game-actions">{children}</div>;
}
function Frame({
  state,
  ...rest
}: { state: BusState } & Omit<FrameProps, "active">) {
  return <BusFrame active={busPhase(state.phase, state.endReason)} {...rest} />;
}
interface FrameProps {
  active: number;
  counter: string;
  player?: string;
  label?: string;
  children: ReactNode;
}
export function BusFrame({
  active,
  counter,
  player,
  label,
  children,
}: FrameProps) {
  return (
    <div className="round-board bus-board" tabIndex={-1}>
      <ol className="bus-phases" aria-label="Spillets faser">
        {["H-en", "Fire gjetninger", "Pyramiden"].map((name, index) => (
          <li
            key={name}
            aria-current={index === active ? "step" : undefined}
            className={
              index === active
                ? "bus-phase-current"
                : index < active
                  ? "bus-phase-complete"
                  : ""
            }
          >
            <span>{index + 1}</span>
            {name}
          </li>
        ))}
      </ol>
      <p className="bus-counter">{counter}</p>
      {player && <TurnBanner player={player} label={label} />}
      <div className="bus-content">{children}</div>
    </div>
  );
}
export function Hand({
  cards,
  revealed = cards.length,
  active,
  onPlay,
  match,
  faceDown,
}: {
  cards: Card[];
  revealed?: number;
  active?: number;
  onPlay?: (slot: number) => void;
  match?: number;
  /** Set inside the hand drawer: the cards flip over as it opens and closes. */
  faceDown?: boolean;
}) {
  const face = (card: Card, index: number) =>
    faceDown === undefined ? (
      <PlayingCard card={card} back={index >= revealed} />
    ) : (
      <span className="bus-flip" style={{ "--i": index } as CSSProperties}>
        <span className={`bus-flip-inner ${faceDown ? "bus-flip-down" : ""}`}>
          <span className="bus-flip-face" aria-hidden={faceDown}>
            <PlayingCard card={card} />
          </span>
          <span className="bus-flip-face bus-flip-back" aria-hidden={!faceDown}>
            <PlayingCard card={card} back />
          </span>
        </span>
      </span>
    );
  return (
    <div className="bus-hand">
      {cards.map((card, index) => {
        // the card itself is the key, so laying one keeps the others mounted;
        // hidden cards share one stand-in, so repeats are numbered
        const repeat = cards
          .slice(0, index)
          .filter(
            (other) => other.rank === card.rank && other.suit === card.suit,
          ).length;
        const key = `${card.rank}${card.suit}${repeat ? `-${repeat}` : ""}`;
        const content = (
          <>
            {face(card, index)}
            <span className="bus-card-caption">
              Kort {index + 1}
              {active === index
                ? index < revealed
                  ? " · snudd nå"
                  : " · neste kort"
                : ""}
            </span>
          </>
        );
        return onPlay ? (
          <button
            key={key}
            className="bus-card-choice"
            disabled={card.rank !== match}
            aria-label={`Legg ${cardLabel(card.rank)} ${card.suit}`}
            onClick={() => onPlay(index)}
          >
            {face(card, index)}
            <span>{card.rank === match ? "Legg kortet" : "Ingen match"}</span>
          </button>
        ) : (
          <div key={key} className={active === index ? "bus-active-card" : ""}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
/**
 * The private hand, tucked into the bottom of the screen.
 *
 * Closed, only the handle and the top of the face-down cards peek up, so the
 * phone can change hands without showing anything. A tap or an upward swipe
 * slides the drawer up and flips the cards; the handle, a downward swipe or
 * Escape puts them away again. Rendered into <body> so no transformed parent
 * can pin the fixed position to itself.
 */
export function HandDrawer({
  count,
  label,
  hideLabel = "Skjul kortene",
  closeOn,
  children,
}: {
  count?: number;
  /** What the closed handle says; defaults to a hint about the cards. */
  label?: string;
  hideLabel?: string;
  /** The drawer closes whenever this changes, e.g. after a card is played. */
  closeOn?: unknown;
  children: (open: boolean) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(closeOn);
  if (seen !== closeOn) {
    setSeen(closeOn);
    setOpen(false);
  }
  const drag = useRef<{ y: number; moved: boolean } | null>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  // a swipe ends in a click too; that click must not undo the swipe
  const swiped = () => {
    const moved = drag.current?.moved ?? false;
    drag.current = null;
    return moved;
  };
  return createPortal(
    <div
      className={`bus-drawer ${open ? "bus-drawer-open" : ""}`}
      onPointerDown={(event) => {
        drag.current = { y: event.clientY, moved: false };
      }}
      onPointerUp={(event) => {
        if (!drag.current) return;
        const dy = event.clientY - drag.current.y;
        if (Math.abs(dy) < 30) return;
        drag.current.moved = true;
        setOpen(dy < 0);
      }}
      onClick={() => {
        if (!swiped() && !open) setOpen(true);
      }}
    >
      <button
        type="button"
        className="bus-drawer-handle"
        aria-expanded={open}
        aria-controls="bus-drawer-cards"
        onClick={(event) => {
          event.stopPropagation();
          if (!swiped()) setOpen((value) => !value);
        }}
      >
        <span className="bus-drawer-grip" aria-hidden="true" />
        {open
          ? hideLabel
          : (label ?? `Trykk for å se kortene dine · ${count ?? 0} kort`)}
      </button>
      <div id="bus-drawer-cards" className="bus-drawer-cards" inert={!open}>
        {children(open)}
      </div>
    </div>,
    document.body,
  );
}
function HBoard({
  state,
  onReveal,
}: {
  state: BusState;
  onReveal: () => void;
}) {
  const { table } = state;
  const revealed = table.index - (table.stage === "covered" ? 1 : 0);
  return (
    <HCards
      h={state.h.map((card, index) => (index > revealed ? null : card))}
      index={table.index}
      canReveal={table.stage === "covered"}
      onReveal={onReveal}
    />
  );
}
/** The H as a phone sees it: `null` for every card that is still face down. */
export function HCards({
  h,
  index: current,
  canReveal,
  onReveal,
}: {
  h: (Card | null)[];
  index: number;
  canReveal: boolean;
  onReveal?: () => void;
}) {
  return (
    <>
      <div className="bus-h-legend">
        <span>Gi bort 🍺</span>
        <span>Shots 🥃</span>
        <span>Ta selv 🍺</span>
      </div>
      <div
        className="bus-h"
        role="group"
        aria-label="H-en: gi bort til venstre, ta selv til høyre, to shots i midten"
      >
        {h.map((card, index) => (
          <button
            key={index}
            className={`bus-h-card ${index === current ? "bus-active-card" : ""}`}
            style={{
              gridColumn: index < 10 ? (index % 2 === 0 ? 4 : 1) : index - 8,
              gridRow: index < 10 ? Math.floor(index / 2) + 1 : 3,
            }}
            disabled={!onReveal || index !== current || !canReveal}
            onClick={onReveal}
            aria-label={
              card
                ? `H-kort ${index + 1}: ${cardLabel(card.rank)} ${card.suit}`
                : `Snu H-kort ${index + 1}: ${effectLabels[hEffect(index)]}`
            }
          >
            <PlayingCard card={card ?? HIDDEN_CARD} back={!card} />
          </button>
        ))}
      </div>
    </>
  );
}
function Pyramid({
  state,
  onPick,
}: {
  state: BusState;
  onPick: (index: number) => void;
}) {
  return (
    <PyramidCards
      pyramid={state.pyramid.map((card, index) =>
        state.bus.picks.includes(index) ? card : null,
      )}
      row={state.bus.row}
      active={state.phase === "bus" && state.bus.stage === "pick"}
      onPick={onPick}
    />
  );
}
/** The pyramid as a phone sees it: only the picked cards are known. */
export function PyramidCards({
  pyramid,
  row: current,
  active,
  onPick,
}: {
  pyramid: (Card | null)[];
  row: number;
  active: boolean;
  onPick?: (index: number) => void;
}) {
  return (
    <div
      className="bus-pyramid"
      role="group"
      aria-label="Velg ett kort per rad, fra bunnen til toppen"
    >
      {[[14], [12, 13], [9, 10, 11], [5, 6, 7, 8], [0, 1, 2, 3, 4]].map(
        (indices, i) => {
          const row = 5 - i;
          return (
            <div
              className={`bus-pyramid-row ${current === row ? "bus-current-row" : ""}`}
              key={row}
            >
              <div className="bus-pyramid-cards">
                {indices.map((index) => {
                  const card = pyramid[index];
                  return (
                    <button
                      key={index}
                      className={`bus-pyramid-choice ${card ? "bus-picked-card" : ""}`}
                      disabled={!onPick || !active || row !== current}
                      onClick={() => onPick?.(index)}
                      aria-label={
                        card
                          ? `Rad ${row}: ${cardLabel(card.rank)} ${card.suit}`
                          : `Velg kort ${indices.indexOf(index) + 1} på rad ${row}`
                      }
                    >
                      <PlayingCard card={card ?? HIDDEN_CARD} back={!card} />
                    </button>
                  );
                })}
              </div>
              <span className="bus-row-value">
                {row === 5 ? "🥃" : `${row * 2} 🍺`}
                <small>Rad {row}</small>
              </span>
            </div>
          );
        },
      )}
    </div>
  );
}
export function BusRoute({
  players,
  onFinish,
}: {
  players: Player[];
  onFinish: () => void;
}) {
  const [state, setState] = useState(() => createBusGame(players));
  const act = (action: BusAction) => {
    setState((current) => playBus(current, action));
    if (
      [
        "next-player",
        "view-hand",
        "confirm-hand",
        "close-hand",
        "start-h",
        "choose-driver",
        "ride-together",
        "start-bus",
        "retry-bus",
      ].includes(action.type)
    )
      requestAnimationFrame(() =>
        document
          .querySelector<HTMLElement>(".bus-board")
          ?.focus({ preventScroll: false }),
      );
    if (["start-bus", "next-row", "retry-bus"].includes(action.type))
      requestAnimationFrame(() =>
        document
          .querySelector(".bus-current-row")
          ?.scrollIntoView({ block: "center", behavior: "instant" }),
      );
  };
  return <BusGame state={state} act={act} onFinish={onFinish} />;
}

export function BusGame({
  state,
  act,
  onFinish,
}: {
  state: BusState;
  act: (action: BusAction) => void;
  onFinish: () => void;
}) {
  const players = state.players;
  const recipients = (actor: number, onChoose: (index: number) => void) => (
    <div className="bus-player-grid">
      {players.map(
        (player, index) =>
          index !== actor && (
            <button
              className="button secondary"
              key={player.id}
              onClick={() => onChoose(index)}
            >
              {player.name}
            </button>
          ),
      )}
    </div>
  );
  const roster = (
    <ul className="bus-remaining" aria-label="Kort igjen på hånden">
      {players.map((player, index) => (
        <li key={player.id}>
          <span>{player.name}</span>
          <strong>{state.hands[index].length} kort</strong>
        </li>
      ))}
    </ul>
  );
  if (state.phase === "h") {
    const { table } = state;
    const viewer = table.viewer === null ? undefined : players[table.viewer];
    const privateHand = table.stage === "hand" || table.stage === "handoff";
    const effect = table.index < 0 ? null : hEffect(table.index);
    return (
      <Frame
        state={state}
        counter={
          table.index < 0
            ? "Fire kort til hver · målet er null igjen"
            : `H-kort ${table.index + 1} av ${H_CARD_COUNT} · ${effectLabels[effect!]}`
        }
        player={viewer?.name}
        label={
          table.stage === "handoff" ? "Gi mobilen til" : "Din private hånd"
        }
      >
        {privateHand ? (
          <>
            <div className="bus-message">
              <h2>
                {table.stage === "handoff"
                  ? `Bare ${viewer!.name} skal se kortene`
                  : table.index < 0
                    ? "Husk de fire kortene dine"
                    : `Har du ${cardLabel(state.h[table.index].rank)}?`}
              </h2>
              <p>
                {table.stage === "handoff"
                  ? "De andre ser bort. Bekreft når du holder mobilen."
                  : table.index < 0
                    ? "Skjul hånden før du gir mobilen videre."
                    : effectLabels[effect!]}
              </p>
            </div>
            {table.stage === "hand" && (
              <>
                <HandDrawer
                  key={table.viewer}
                  count={state.hands[table.viewer!].length}
                >
                  {(open) => (
                    <Hand
                      cards={state.hands[table.viewer!]}
                      faceDown={!open}
                      match={
                        table.index >= 0 ? state.h[table.index].rank : undefined
                      }
                      onPlay={
                        table.index >= 0
                          ? (slot) => act({ type: "play-card", slot })
                          : undefined
                      }
                    />
                  )}
                </HandDrawer>
                <div className="bus-drawer-spacer" aria-hidden="true" />
              </>
            )}
            <Actions>
              {table.stage === "handoff" && (
                <button
                  className="button primary"
                  onClick={() => act({ type: "confirm-hand" })}
                >
                  Jeg er {viewer!.name} · vis kortene
                </button>
              )}
              <button
                className="button secondary"
                onClick={() => act({ type: "close-hand" })}
              >
                {table.stage === "hand"
                  ? "Skjul hånden · tilbake til H-en"
                  : "Tilbake uten å vise kort"}
              </button>
            </Actions>
          </>
        ) : table.stage === "award" ? (
          <>
            <div className="bus-message">
              <h2>{players[table.actor!].name} gir bort 1 slurk 🍺</h2>
              <p>Hvem skal drikke?</p>
            </div>
            {recipients(table.actor!, (recipient) =>
              act({ type: "award", recipient }),
            )}
          </>
        ) : (
          <>
            {table.stage === "intro" && (
              <div className="bus-message">
                <h2>H-en først. Bussruta etterpå.</h2>
                <p>
                  Alle har fått fire kort. Trykk på navnet ditt for å se hånden
                  privat. Gi bort til venstre, ta selv til høyre. Vi snur
                  annenhver side: ta én slurk, gi bort én slurk. De to kortene i
                  midten er shots.
                </p>
                <p className="muted small">
                  Én slurk per match på sidene. En shot per match i midten.
                </p>
              </div>
            )}
            <HBoard state={state} onReveal={() => act({ type: "reveal-h" })} />
            {table.played && (
              <p className="result-message" role="status">
                {effect === "give"
                  ? `${players[table.actor!].name} gir 1 slurk til ${players[table.recipient!].name} 🍺`
                  : `${players[table.actor!].name}: ${effectLabels[effect!]}`}
              </p>
            )}
            {(table.stage === "intro" || table.stage === "open") && (
              <>
                <p className="bus-hand-hint">
                  {table.stage === "intro"
                    ? "Se kortene dine før dere begynner:"
                    : `Samme verdi som ${cardLabel(state.h[table.index].rank)}? Velg navnet ditt og legg kort. Flere spillere kan legge på samme H-kort.`}
                </p>
                <div className="bus-player-grid">
                  {players.map((player, index) => (
                    <button
                      className="button secondary"
                      key={player.id}
                      disabled={!state.hands[index].length}
                      onClick={() => act({ type: "view-hand", player: index })}
                    >
                      {player.name}
                      <small>{state.hands[index].length} kort igjen</small>
                    </button>
                  ))}
                </div>
              </>
            )}
            <Actions>
              <button
                className="button primary"
                onClick={() =>
                  act({
                    type:
                      table.stage === "intro"
                        ? "start-h"
                        : table.stage === "covered"
                          ? "reveal-h"
                          : "next-h",
                  })
                }
              >
                {table.stage === "intro"
                  ? "Alle har sett kortene · start H-en"
                  : table.stage === "covered"
                    ? "Snu det markerte H-kortet"
                    : table.index === H_CARD_COUNT - 1
                      ? "H-en er ferdig · hvem tar bussen?"
                      : "Alle ferdige · neste H-kort →"}
              </button>
            </Actions>
          </>
        )}
        {!privateHand && roster}
      </Frame>
    );
  }
  if (state.phase === "driver")
    return (
      <Frame
        state={state}
        counter="H-en er ferdig · flere har flest kort igjen"
      >
        <div className="bus-message">
          <h2>Hvem tar Bussruta?</h2>
          <p>
            {state.driverCandidates.map((i) => players[i].name).join(" og ")}{" "}
            har {state.hands[state.driverCandidates[0]].length} kort igjen hver.
          </p>
          <p>
            Spill stein, saks, papir og velg taperen nedenfor. Eller ta hele
            Bussruta sammen.
          </p>
        </div>
        <div className="bus-player-grid">
          {state.driverCandidates.map((index) => (
            <button
              className="button secondary"
              key={index}
              onClick={() => act({ type: "choose-driver", player: index })}
            >
              {players[index].name} tar bussen
            </button>
          ))}
        </div>
        <Actions>
          <button
            className="button primary"
            onClick={() => act({ type: "ride-together" })}
          >
            Vi tar Bussruta sammen 🚌
          </button>
        </Actions>
        {roster}
      </Frame>
    );
  if (state.phase === "deal") {
    const { deal } = state;
    const amount = deal.question + 1;
    const hand = state.guessHands[deal.player];
    const nextDriver =
      state.drivers[
        (state.drivers.indexOf(deal.player) + 1) % state.drivers.length
      ];
    const last = deal.question === 3 && deal.player === state.drivers.at(-1);
    return (
      <Frame
        state={state}
        counter={`Bussruta · del 1 · kort ${amount} av 4 · spiller ${state.drivers.indexOf(deal.player) + 1} av ${state.drivers.length}`}
        player={players[deal.player].name}
        label={deal.stage === "handoff" ? "Gi mobilen til" : undefined}
      >
        {deal.stage === "handoff" ? (
          <>
            <div className="bus-message">
              <h2>{questions[deal.question]}</h2>
              <p>
                Ett kort hver før neste spiller. Riktig: gi bort {sips(amount)}{" "}
                🍺. Feil: ta {sips(amount)} 🍺.
              </p>
            </div>
            <Actions>
              <button
                className="button primary"
                onClick={() => act({ type: "confirm-deal" })}
              >
                Jeg er {players[deal.player].name} · klar
              </button>
            </Actions>
          </>
        ) : (
          <>
            <div className="bus-message">
              <h2>{questions[deal.question]}</h2>
              <p className="muted small">
                {deal.question === 0
                  ? "Gjett fargen på det markerte kortet."
                  : deal.question === 1
                    ? "Sammenlign det markerte kortet med kort 1. Ess er høyest. Likt er feil."
                    : deal.question === 2
                      ? "Kort 3 skal være strengt mellom kort 1 og 2, eller utenfor. Lik en grense er feil."
                      : "Gjett sorten på det markerte kortet."}
              </p>
            </div>
            <Hand
              cards={hand}
              active={deal.question}
              revealed={deal.question + (deal.stage === "feedback" ? 1 : 0)}
            />
            {deal.stage === "guess" ? (
              <Actions>
                {guesses[deal.question].map(([guess, label]) => (
                  <button
                    key={guess}
                    className="button secondary"
                    onClick={() => act({ type: "deal-guess", guess })}
                  >
                    {label}
                  </button>
                ))}
              </Actions>
            ) : (
              <>
                <p
                  className={`bus-feedback ${deal.correct ? "bus-correct" : "bus-wrong"}`}
                  role="status"
                >
                  {deal.correct
                    ? deal.recipient === null
                      ? `Riktig! Gi bort ${sips(amount)} 🍺`
                      : `${players[deal.recipient].name} tar ${sips(amount)} 🍺`
                    : `Feil! Ta ${sips(amount)} 🍺`}
                </p>
                {deal.correct && deal.recipient === null ? (
                  <>
                    <p className="bus-hand-hint">Hvem gir du slurkene til?</p>
                    {recipients(deal.player, (recipient) =>
                      act({ type: "deal-award", recipient }),
                    )}
                  </>
                ) : (
                  <Actions>
                    <button
                      className="button primary"
                      onClick={() => act({ type: "next-player" })}
                    >
                      {last
                        ? "Til Bussruta del 2 · pyramiden →"
                        : `Skjul kortene · ${players[nextDriver].name} sin tur →`}
                    </button>
                  </Actions>
                )}
              </>
            )}
          </>
        )}
      </Frame>
    );
  }
  const names = state.drivers.map((i) => players[i].name).join(" og ");
  const pick = (index: number) => act({ type: "pick-pyramid", index });
  if (state.phase === "done")
    return (
      <Frame state={state} counter="H-en + Bussruta · endestasjon">
        <div className="bus-message">
          <span className="bus-finish-symbol" aria-hidden="true">
            {state.endReason === "cleared" ? "🎉" : "🚌"}
          </span>
          <h2>
            {state.endReason === "no-driver"
              ? "Alle tømte hånden!"
              : state.endReason === "cleared"
                ? "Dere kom til toppen!"
                : "Bussturen er avsluttet"}
          </h2>
          <p>
            {state.endReason === "no-driver"
              ? "Null kort igjen til noen. Alle slipper Bussruta."
              : `${names} · ${state.bus.attempt} forsøk · ${state.bus.failures} bildekort.`}
          </p>
        </div>
        {state.endReason === "cleared" && (
          <Pyramid state={state} onPick={pick} />
        )}
        <Actions>
          <button className="button primary" onClick={onFinish}>
            Se oppsummering
          </button>
        </Actions>
      </Frame>
    );
  const { bus } = state;
  const penalty = pyramidPenalty(bus.row);
  return (
    <Frame
      state={state}
      counter={`Bussruta · del 2 · forsøk ${bus.attempt} · rad ${bus.row} av 5`}
      player={state.drivers.length > 1 ? "Busslaget" : names}
      label={
        state.drivers.length > 1
          ? `${state.drivers.length} spillere tar bussen sammen`
          : "På Bussruta"
      }
    >
      {state.drivers.length > 1 && (
        <details className="bus-riders">
          <summary>Hvem er på bussen?</summary>
          <p>{names}</p>
        </details>
      )}
      <div className="bus-message">
        <h2>
          {bus.stage === "ready"
            ? "Unngå bildekortene"
            : bus.stage === "pick"
              ? `Velg ett kort på rad ${bus.row}`
              : bus.failed
                ? "Bildekort! Hele pyramiden starter på nytt"
                : "Trygt kort! Videre oppover"}
        </h2>
        <p>
          {bus.stage === "ready"
            ? "Trykk på ett kort per rad, fra bunnen til toppen. Knekt, dame og konge sender dere tilbake til start. Ess er trygt."
            : bus.stage === "pick"
              ? "Den markerte raden er aktiv. Velg selv hvilket kort dere vil snu."
              : bus.failed
                ? penalty.shot
                  ? "Ta en shot 🥃"
                  : `Ta ${sips(penalty.sips)} 🍺`
                : "Ingen bildekort. Neste rad venter."}
        </p>
      </div>
      <Pyramid state={state} onPick={pick} />
      <Actions>
        {bus.stage === "ready" ? (
          <button
            className="button primary"
            onClick={() => act({ type: "start-bus" })}
          >
            Start pyramiden 🚌
          </button>
        ) : bus.stage === "feedback" ? (
          <button
            className="button primary"
            onClick={() => act({ type: bus.failed ? "retry-bus" : "next-row" })}
          >
            {bus.failed ? "Stokk hele pyramiden · prøv igjen ↻" : "Neste rad ↑"}
          </button>
        ) : (
          <p className="action-hint">
            {penalty.shot
              ? "Bildekort på toppen = en shot 🥃"
              : `Bildekort på denne raden = ${sips(penalty.sips)} 🍺`}
          </p>
        )}
        <button
          className="text-button"
          onClick={() => act({ type: "skip-bus" })}
        >
          Avslutt bussturen
        </button>
      </Actions>
    </Frame>
  );
}
