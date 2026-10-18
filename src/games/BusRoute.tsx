import { useState, type ReactNode } from "react";
import { cardLabel, type Card, type Player } from "../../shared/engine";
import {
  BUS_ATTEMPTS,
  BUS_ROUTE_LENGTH,
  createBusGame,
  playBus,
  pyramidRow,
  type BusAction,
  type BusGuess,
  type BusState,
} from "../../shared/bus";
import { PlayingCard, TurnBanner } from "./GameControls";
import { ScoreStrip } from "./PartyUI";

function BusFrame({
  state,
  counter,
  player,
  label,
  children,
}: {
  state: BusState;
  counter: string;
  player?: Player;
  label?: string;
  children: ReactNode;
}) {
  const active =
    state.phase === "deal"
      ? 0
      : state.phase === "pyramid" ||
          state.phase === "driver" ||
          state.endReason === "no-driver"
        ? 1
        : 2;
  return (
    <div className="round-board bus-board">
      <ol className="bus-phases" aria-label="Spillets faser">
        {["Utdeling", "Pyramiden", "Bussturen"].map((name, index) => (
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
      {player && <TurnBanner player={player.name} label={label} />}
      <div className="bus-content">{children}</div>
    </div>
  );
}
function Hand({
  cards,
  revealed = cards.length,
  onPlay,
  match,
}: {
  cards: Card[];
  revealed?: number;
  onPlay?: (slot: number) => void;
  match?: number;
}) {
  return (
    <div className="bus-hand">
      {cards.map((card, index) =>
        onPlay ? (
          <button
            key={`${card.rank}${card.suit}`}
            className="bus-card-choice"
            disabled={card.rank !== match}
            aria-label={`Legg ${cardLabel(card.rank)} ${card.suit}`}
            onClick={() => onPlay(index)}
          >
            <PlayingCard card={card} />
            <span>{card.rank === match ? "Legg kortet" : "Ingen match"}</span>
          </button>
        ) : (
          <div key={`${card.rank}${card.suit}`}>
            <PlayingCard card={card} back={index >= revealed} />
          </div>
        ),
      )}
    </div>
  );
}
function Actions({ children }: { children: ReactNode }) {
  return <div className="actions centered game-actions">{children}</div>;
}
function GuessButtons({
  question,
  onGuess,
}: {
  question: number;
  onGuess: (guess: BusGuess) => void;
}) {
  const options: [BusGuess, string][][] = [
    [
      ["red", "♥ Rød"],
      ["black", "♠ Svart"],
    ],
    [
      ["higher", "↑ Høyere"],
      ["lower", "↓ Lavere"],
    ],
    [
      ["inside", "↔ Innenfor"],
      ["outside", "⇥ Utenfor"],
    ],
    [
      ["♠", "♠ Spar"],
      ["♥", "♥ Hjerter"],
      ["♣", "♣ Kløver"],
      ["♦", "♦ Ruter"],
    ],
  ];
  return (
    <>
      {options[question].map(([value, label], index) => (
        <button
          key={value}
          className={`button ${index === 0 ? "primary" : "secondary"}`}
          onClick={() => onGuess(value)}
        >
          {label}
        </button>
      ))}
    </>
  );
}
function Pyramid({ state }: { state: BusState }) {
  const groups = [[14], [12, 13], [9, 10, 11], [5, 6, 7, 8], [0, 1, 2, 3, 4]];
  const revealed =
    state.table.stage === "intro"
      ? -1
      : state.table.index - (state.table.stage === "covered" ? 1 : 0);
  return (
    <div className="bus-pyramid" aria-hidden="true">
      {groups.map((group, row) => (
        <div className="bus-pyramid-row" key={row}>
          {group.map((index) => (
            <div
              key={index}
              className={index === revealed ? "bus-active-card" : ""}
            >
              <PlayingCard
                card={state.pyramid[index]}
                back={index > revealed}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
function BusRoad({ state }: { state: BusState }) {
  const { bus } = state;
  const route = state.routes[bus.attempt];
  const revealed =
    bus.stage === "ready"
      ? 0
      : bus.stage === "guess"
        ? bus.cursor
        : bus.cursor + 1;
  return (
    <ol className="bus-road" aria-label="Bussturen har fem kort">
      {route.map((card, index) => (
        <li
          key={index}
          className={index === bus.cursor ? "bus-road-current" : ""}
        >
          <PlayingCard card={card} back={index >= revealed} />
          <span>{index === 0 ? "Start" : `Stopp ${index}`}</span>
        </li>
      ))}
    </ol>
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
        "hide-hand",
        "confirm-deal",
        "view-hand",
        "close-hand",
        "award",
        "start-pyramid",
        "next-pyramid",
        "draw-driver",
        "start-bus",
        "retry-bus",
      ].includes(action.type)
    )
      requestAnimationFrame(() =>
        document
          .querySelector(".bus-board")
          ?.scrollIntoView({ block: "start", behavior: "instant" }),
      );
  };
  const scoreMap = Object.fromEntries(
    state.players.map((player, index) => [player.id, state.scores[index]]),
  );
  if (state.phase === "deal") {
    const { deal } = state;
    const player = state.players[deal.player];
    const hand = state.hands[deal.player];
    const title = [
      "Rød eller svart?",
      "Høyere eller lavere enn første kort?",
      "Innenfor eller utenfor de to første?",
      "Hvilken sort kommer nå?",
    ][deal.question];
    const visible =
      deal.stage === "memory"
        ? 4
        : deal.stage === "feedback"
          ? deal.question + 1
          : deal.question;
    return (
      <BusFrame
        state={state}
        counter={`Del 1 · Spiller ${deal.player + 1} av ${players.length} · Spørsmål ${deal.question + 1} av 4`}
        player={player}
        label={deal.stage === "handoff" ? "Gi mobilen til" : undefined}
      >
        {deal.stage === "handoff" ? (
          <>
            <div className="bus-message">
              <span className="bus-ticket" aria-hidden="true">
                BILLETT 01
              </span>
              <h2>Fire kort. Fire gjetninger.</h2>
              <p>
                De andre ser bort. Vis kortene først når {player.name} holder
                mobilen.
              </p>
              <p className="muted small">
                Ess er høyest. Like kort teller som feil.
              </p>
            </div>
            <Actions>
              <button
                className="button primary"
                onClick={() => act({ type: "confirm-deal" })}
              >
                Jeg er {player.name} · start
              </button>
            </Actions>
          </>
        ) : (
          <>
            <Hand cards={hand} revealed={visible} />
            <div className="bus-message">
              <p className="eyebrow">
                {deal.stage === "memory"
                  ? "Husk kortene dine"
                  : `Gjetning ${deal.question + 1} / 4`}
              </p>
              <h2>
                {deal.stage === "memory"
                  ? "Disse tar du med til pyramiden."
                  : title}
              </h2>
              {deal.stage === "guess" && deal.question === 2 && (
                <p className="muted small">
                  Innenfor betyr strengt mellom kortverdiene. Likt med en grense
                  er feil for begge valg.
                </p>
              )}
              {deal.stage === "feedback" && (
                <p
                  className={`bus-feedback ${deal.correct ? "bus-correct" : ""}`}
                  role="status"
                >
                  {deal.correct
                    ? "Riktig! Ett poeng."
                    : "Bom. En valgfri slurk."}
                </p>
              )}
              {deal.stage === "memory" && (
                <p>
                  Du kan se hånden igjen på din tur i pyramiden. Skjul kortene
                  før du gir mobilen videre.
                </p>
              )}
            </div>
            <Actions>
              {deal.stage === "guess" ? (
                <GuessButtons
                  question={deal.question}
                  onGuess={(guess) => act({ type: "deal-guess", guess })}
                />
              ) : deal.stage === "feedback" ? (
                <button
                  className="button primary"
                  onClick={() => act({ type: "next-question" })}
                >
                  {deal.question === 3
                    ? "Se og husk hånden"
                    : "Neste spørsmål →"}
                </button>
              ) : (
                <button
                  className="button primary"
                  onClick={() => act({ type: "hide-hand" })}
                >
                  {deal.player + 1 === players.length
                    ? "Skjul kortene · til pyramiden"
                    : "Skjul kortene og gi videre →"}
                </button>
              )}
            </Actions>
          </>
        )}
      </BusFrame>
    );
  }
  if (state.phase === "pyramid") {
    const { table } = state;
    const current = state.pyramid[table.index];
    const row = pyramidRow(table.index);
    const viewer = table.viewer === null ? undefined : players[table.viewer];
    const privateView = table.stage === "handoff" || table.stage === "hand";
    return (
      <BusFrame
        state={state}
        counter={`Del 2 · Pyramidekort ${table.index + 1} av 15 · Rad ${row} = ${row} poeng`}
        player={viewer}
        label={table.stage === "handoff" ? "Gi mobilen til" : "Bare din hånd"}
      >
        {table.stage === "intro" ? (
          <>
            <div className="bus-message">
              <span className="bus-ticket" aria-hidden="true">
                BILLETT 02
              </span>
              <h2>Legg mobilen midt på bordet.</h2>
              <p>
                Snu fra bunnen. Samme kortverdi kan legges for radens poeng.
                Hvert lagt kort kan gi én valgfri slurk til en annen spiller.
              </p>
            </div>
            <Pyramid state={state} />
            <Actions>
              <button
                className="button primary"
                onClick={() => act({ type: "start-pyramid" })}
              >
                Alle er klare · start pyramiden
              </button>
            </Actions>
          </>
        ) : (
          <>
            {!privateView && table.stage !== "award" && (
              <Pyramid state={state} />
            )}
            {privateView ? (
              <>
                <div className="bus-message">
                  <h2>
                    {table.stage === "handoff"
                      ? "De andre ser bort."
                      : "Har du samme kortverdi?"}
                  </h2>
                  <p className="muted">
                    På bordet: {cardLabel(current.rank)} {current.suit}. Ett
                    lagt kort gir {row} poeng.
                  </p>
                </div>
                {table.stage === "hand" && (
                  <Hand
                    cards={state.hands[table.viewer!]}
                    match={current.rank}
                    onPlay={(slot) => act({ type: "play-card", slot })}
                  />
                )}
                {table.stage === "hand" &&
                  !state.hands[table.viewer!].some(
                    (card) => card.rank === current.rank,
                  ) && (
                    <p className="party-note muted">
                      Ingen kort passer. Skjul hånden og gi mobilen tilbake.
                    </p>
                  )}
                <Actions>
                  {table.stage === "handoff" ? (
                    <button
                      className="button primary"
                      onClick={() => act({ type: "confirm-hand" })}
                    >
                      Jeg er {viewer!.name} · vis hånden
                    </button>
                  ) : null}
                  <button
                    className={`button ${table.stage === "handoff" ? "secondary" : "primary"}`}
                    onClick={() => act({ type: "close-hand" })}
                  >
                    Skjul og tilbake til bordet
                  </button>
                </Actions>
              </>
            ) : table.stage === "award" ? (
              <>
                <div className="bus-message">
                  <h2>
                    {viewer!.name} la {cardLabel(table.played!.rank)}{" "}
                    {table.played!.suit}!
                  </h2>
                  <p>{row} poeng er lagt til. Hånden er skjult.</p>
                  <p>Velg én annen spiller til én valgfri slurk.</p>
                </div>
                <div className="bus-player-grid">
                  {players.map((player, index) =>
                    index === table.viewer ? null : (
                      <button
                        className="button secondary"
                        key={player.id}
                        onClick={() => act({ type: "award", recipient: index })}
                      >
                        {player.name}
                      </button>
                    ),
                  )}
                </div>
                <Actions>
                  <button
                    className="button primary"
                    onClick={() => act({ type: "award", recipient: null })}
                  >
                    Hopp over utdelingen · tilbake til bordet
                  </button>
                </Actions>
              </>
            ) : (
              <>
                <div className="bus-message">
                  {table.stage === "open" && (
                    <p className="eyebrow" role="status">
                      På bordet: {cardLabel(current.rank)}{" "}
                      {
                        {
                          "♠": "spar",
                          "♥": "hjerter",
                          "♣": "kløver",
                          "♦": "ruter",
                        }[current.suit]
                      }
                    </p>
                  )}
                  <h2>
                    {table.stage === "covered"
                      ? "Neste kort venter."
                      : "Hvem vil legge et kort?"}
                  </h2>
                  {table.recipient !== null && (
                    <p className="bus-feedback" role="status">
                      {players[table.recipient].name} kan ta én valgfri slurk.
                    </p>
                  )}
                  <p className="muted small">
                    {table.stage === "covered"
                      ? "Alle hender er skjult."
                      : "Velg et navn for å se egen hånd i skjul. Dere kan legge flere kort før neste pyramidekort."}
                  </p>
                </div>
                {table.stage === "open" && (
                  <div className="bus-player-grid">
                    {players.map((player, index) => (
                      <button
                        className="button secondary"
                        disabled={!state.hands[index].length}
                        key={player.id}
                        onClick={() =>
                          act({ type: "view-hand", player: index })
                        }
                      >
                        <span>{player.name}</span>
                        <small>{state.hands[index].length} kort igjen</small>
                      </button>
                    ))}
                  </div>
                )}
                <Actions>
                  {table.stage === "covered" ? (
                    <button
                      className="button primary"
                      onClick={() => act({ type: "reveal-pyramid" })}
                    >
                      Snu pyramidekortet
                    </button>
                  ) : (
                    <button
                      className="button primary"
                      onClick={() => act({ type: "next-pyramid" })}
                    >
                      {table.index === 14 ||
                      state.hands.every((hand) => !hand.length)
                        ? "Pyramiden er ferdig · finn sjåføren"
                        : "Alle ferdige · neste pyramidekort →"}
                    </button>
                  )}
                </Actions>
              </>
            )}
          </>
        )}
        <ScoreStrip players={players} scores={scoreMap} />
      </BusFrame>
    );
  }
  if (state.phase === "driver")
    return (
      <BusFrame
        state={state}
        counter="Pyramiden er ferdig · delt flest restkort"
      >
        <div className="bus-message">
          <h2>Hvem skal kjøre?</h2>
          <p>
            Disse har {state.hands[state.driverCandidates[0]].length} kort igjen
            hver. Vi trekker én av dem tilfeldig.
          </p>
        </div>
        <ul className="bus-candidates">
          {state.driverCandidates.map((index) => (
            <li key={players[index].id}>{players[index].name}</li>
          ))}
        </ul>
        <Actions>
          <button
            className="button primary"
            onClick={() => act({ type: "draw-driver" })}
          >
            Trekk sjåfør
          </button>
        </Actions>
        <ScoreStrip players={players} scores={scoreMap} />
      </BusFrame>
    );
  if (state.phase === "done") {
    const winners = players.filter(
      (_, index) => state.scores[index] === Math.max(...state.scores),
    );
    return (
      <BusFrame
        state={state}
        counter="Bussruta · endestasjon"
        player={state.driver === null ? undefined : players[state.driver]}
        label="Sjåføren var"
      >
        <div className="bus-message bus-destination">
          <span aria-hidden="true">✳</span>
          <h2>
            {state.endReason === "no-driver"
              ? "Alle er tomhendte. Ingen busstur!"
              : state.endReason === "cleared"
                ? "Fremme! Hele ruta gikk inn."
                : state.endReason === "attempt-limit"
                  ? "Tre forsøk. Vi parkerer her."
                  : "Bussen er parkert."}
          </h2>
          <p>
            {state.endReason === "no-driver"
              ? "Dere la alle kortene i pyramiden."
              : state.endReason === "cleared"
                ? `Fire riktige på rad på forsøk ${state.bus.attempt + 1}.`
                : state.endReason === "attempt-limit"
                  ? "Tredje forsøk er brukt. Bussturen er ferdig."
                  : "Sjåføren valgte å avslutte bussturen."}
          </p>
        </div>
        {state.driver !== null && state.bus.stage !== "ready" && (
          <BusRoad state={state} />
        )}
        <div className="bus-final-scores">
          <h3>
            Flest poeng: {winners.map((player) => player.name).join(" & ")}
          </h3>
          <p className="muted small">
            Poeng fra utdeling og pyramide. Restkortene avgjorde sjåføren.
          </p>
          <ScoreStrip players={players} scores={scoreMap} />
        </div>
        <Actions>
          <button className="button primary" onClick={onFinish}>
            Se oppsummering
          </button>
        </Actions>
      </BusFrame>
    );
  }
  const { bus } = state;
  return (
    <BusFrame
      state={state}
      counter={`Del 3 · Forsøk ${bus.attempt + 1} av ${BUS_ATTEMPTS} · ${bus.stage === "guess" ? bus.cursor - 1 : bus.correct ? bus.cursor : bus.cursor - 1} av ${BUS_ROUTE_LENGTH - 1} riktige`}
      player={players[state.driver!]}
      label="Nå kjører"
    >
      {bus.stage === "ready" ? (
        <>
          <div className="bus-message">
            <span className="bus-ticket" aria-hidden="true">
              BILLETT 03
            </span>
            <h2>Fem kort. Fire stopp.</h2>
            <p>
              Gjett høyere eller lavere gjennom hele ruta. Ess er høyest, likt
              er feil. Du får opptil tre forsøk, med en ny stokket bunke hver
              gang.
            </p>
            <p className="muted small">
              Én valgfri slurk ved feil. Du kan alltid parkere bussen.
            </p>
          </div>
          <Actions>
            <button
              className="button primary"
              onClick={() => act({ type: "start-bus" })}
            >
              Start bussturen
            </button>
            <button
              className="button secondary"
              onClick={() => act({ type: "skip-bus" })}
            >
              Avslutt bussturen
            </button>
          </Actions>
        </>
      ) : (
        <>
          <BusRoad state={state} />
          <div className="bus-message">
            <h2>
              {bus.stage === "guess"
                ? "Høyere eller lavere?"
                : bus.correct
                  ? "Riktig! Ett stopp nærmere."
                  : "Bom. En valgfri slurk."}
            </h2>
            <p className="muted small">
              {bus.stage === "feedback" && !bus.correct
                ? "Neste forsøk begynner fra starten med nye kort."
                : "Ess er høyest. Like kort teller som feil."}
            </p>
          </div>
          <Actions>
            {bus.stage === "guess" ? (
              <>
                <button
                  className="button primary"
                  onClick={() => act({ type: "bus-guess", guess: "higher" })}
                >
                  ↑ Høyere
                </button>
                <button
                  className="button secondary"
                  onClick={() => act({ type: "bus-guess", guess: "lower" })}
                >
                  ↓ Lavere
                </button>
              </>
            ) : (
              <button
                className="button primary"
                onClick={() =>
                  act({ type: bus.correct ? "next-stop" : "retry-bus" })
                }
              >
                {bus.correct
                  ? "Neste stopp →"
                  : `Nytt forsøk · ${bus.attempt + 2} av ${BUS_ATTEMPTS}`}
              </button>
            )}
            <button
              className="text-button"
              onClick={() => act({ type: "skip-bus" })}
            >
              Avslutt bussturen
            </button>
          </Actions>
        </>
      )}
    </BusFrame>
  );
}
