import { useState } from "react";
import { cardLabel, type Card } from "../../../shared/engine";
import { H_CARD_COUNT, hEffect, pyramidPenalty } from "../../../shared/bus";
import type { LiveBusView } from "../../../shared/live-bus";
import type { RoomView } from "../../../shared/rooms";
import {
  Actions,
  BusFrame,
  Hand,
  HandDrawer,
  HCards,
  PyramidCards,
} from "../../games/BusRoute";
import {
  HIDDEN_CARD,
  busPhase,
  effectLabels,
  guessHints,
  guesses,
  questions,
  sips,
} from "../../games/bus-copy";

type Send = (input: Record<string, unknown>) => void;
const show = (card: Card) => `${cardLabel(card.rank)} ${card.suit}`;
/** "Ada, Emil og Siri" */
const list = (names: string[]) =>
  names.length < 2
    ? (names[0] ?? "")
    : `${names.slice(0, -1).join(", ")} og ${names.at(-1)}`;

/**
 * H-en + Bussruta with every player on their own phone.
 *
 * Your four cards wait in the drawer at the bottom of your own screen; the
 * table — the H, the guesses and the pyramid — is the same on every phone.
 * The host turns the H; whoever is up guesses and picks from their own phone.
 */
export function LiveBus({
  room,
  view,
  disabled,
  send,
}: {
  room: RoomView;
  view: LiveBusView;
  disabled: boolean;
  send: Send;
}) {
  const host = room.you === room.host;
  const me = view.you;
  const [giving, setGiving] = useState<{ card: Card; at: number } | null>(null);
  const name = (index: number) =>
    `${view.players[index]?.name ?? "?"}${index === me ? " (deg)" : ""}`;
  const move = (type: string, extra: Record<string, unknown> = {}) =>
    send({ action: "bus", move: type, ...extra });
  const others = (actor: number, onChoose: (id: string) => void) => (
    <div className="bus-player-grid">
      {view.players.map(
        (player, index) =>
          index !== actor && (
            <button
              className="button secondary"
              key={player.id}
              disabled={disabled}
              onClick={() => onChoose(player.id)}
            >
              {player.name}
            </button>
          ),
      )}
    </div>
  );
  const roster = (
    <ul className="bus-remaining" aria-label="Kort igjen på hånden">
      {view.players.map((player, index) => (
        <li key={player.id}>
          <span>{name(index)}</span>
          <strong>{player.cards} kort</strong>
        </li>
      ))}
    </ul>
  );
  const active = busPhase(view.phase, view.endReason);

  if (view.phase === "h") {
    const open = view.hStage === "open";
    const effect = view.hIndex < 0 ? null : hEffect(view.hIndex);
    const current = open ? view.h[view.hIndex] : null;
    const matches = current
      ? view.hand.filter((card) => card.rank === current.rank).length
      : 0;
    const pending = giving?.at === view.hIndex ? giving.card : null;
    const play = (card: Card) => {
      if (effect === "give") setGiving({ card, at: view.hIndex });
      else move("play-card", { rank: card.rank, suit: card.suit });
    };
    return (
      <BusFrame
        active={active}
        counter={
          view.hIndex < 0
            ? "Fire kort til hver · målet er null igjen"
            : `H-kort ${view.hIndex + 1} av ${H_CARD_COUNT} · ${effectLabels[effect!]}`
        }
      >
        <div className="bus-message">
          <h2>
            {view.hStage === "intro"
              ? "H-en først. Bussruta etterpå."
              : current
                ? `${show(current)} · ${effectLabels[effect!]}`
                : `H-kort ${view.hIndex + 1} ligger klart`}
          </h2>
          <p>
            {view.hStage === "intro"
              ? "Kortene dine ligger nederst på skjermen. Trykk på dem for å se dem. Gi bort til venstre, ta selv til høyre, shots i midten."
              : !open
                ? host
                  ? "Trykk på det markerte kortet for å snu det."
                  : "Verten snur kortet."
                : matches
                  ? `Du har ${matches === 1 ? "en match" : `${matches} matcher`}! Åpne kortene dine og legg ${matches === 1 ? "den" : "dem"}.`
                  : me >= 0 && view.hand.length
                    ? "Ingen match denne gangen."
                    : "Følg med på hvem som drikker."}
          </p>
        </div>
        <HCards
          h={view.h}
          index={view.hIndex}
          canReveal={view.hStage === "covered" && !disabled}
          onReveal={host ? () => move("reveal-h") : undefined}
        />
        {open && view.plays.length > 0 && (
          <ul className="bus-plays" role="status">
            {view.plays.map((entry, index) => (
              <li key={index}>
                <strong>{name(entry.player)}</strong> legger {show(entry.card)}{" "}
                ·{" "}
                {effect === "give"
                  ? `${name(entry.recipient)} drikker 1 slurk 🍺`
                  : effect === "shot"
                    ? "tar en shot 🥃"
                    : "tar 1 slurk 🍺"}
              </li>
            ))}
          </ul>
        )}
        {host ? (
          <Actions>
            <button
              className="button primary"
              disabled={disabled}
              onClick={() =>
                move(
                  view.hStage === "intro"
                    ? "start-h"
                    : view.hStage === "covered"
                      ? "reveal-h"
                      : "next-h",
                )
              }
            >
              {view.hStage === "intro"
                ? "Alle har sett kortene · start H-en"
                : view.hStage === "covered"
                  ? "Snu det markerte H-kortet"
                  : view.hIndex === H_CARD_COUNT - 1
                    ? "H-en er ferdig · hvem tar bussen?"
                    : "Alle ferdige · neste H-kort →"}
            </button>
          </Actions>
        ) : (
          <p className="action-hint">Verten snur H-en.</p>
        )}
        {roster}
        {me >= 0 && (
          <>
            <HandDrawer key={me} count={view.hand.length}>
              {(drawerOpen) =>
                view.hand.length ? (
                  <>
                    <Hand
                      cards={view.hand}
                      faceDown={!drawerOpen}
                      match={current?.rank}
                      onPlay={
                        current && !disabled
                          ? (slot) => play(view.hand[slot])
                          : undefined
                      }
                    />
                    {pending && (
                      <div className="bus-drawer-give">
                        <p>
                          Du legger {show(pending)}. Hvem skal drikke 1 slurk?
                        </p>
                        {others(me, (recipient) => {
                          setGiving(null);
                          move("play-card", {
                            rank: pending.rank,
                            suit: pending.suit,
                            recipient,
                          });
                        })}
                        <button
                          className="text-button"
                          onClick={() => setGiving(null)}
                        >
                          Avbryt
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="bus-drawer-empty">
                    Tom hånd. Du slipper bussen 🎉
                  </p>
                )
              }
            </HandDrawer>
            <div className="bus-drawer-spacer" aria-hidden="true" />
          </>
        )}
      </BusFrame>
    );
  }

  if (view.phase === "driver") {
    const candidates = view.driverCandidates;
    return (
      <BusFrame
        active={active}
        counter="H-en er ferdig · flere har flest kort igjen"
      >
        <div className="bus-message">
          <h2>Hvem tar Bussruta?</h2>
          <p>
            {list(candidates.map(name))} har{" "}
            {view.players[candidates[0]]?.cards} kort igjen hver.
          </p>
          <p>
            Spill stein, saks, papir.{" "}
            {host
              ? "Velg taperen nedenfor, eller ta hele Bussruta sammen."
              : "Verten velger taperen, eller dere tar Bussruta sammen."}
          </p>
        </div>
        {host && (
          <>
            <div className="bus-player-grid">
              {candidates.map((index) => (
                <button
                  className="button secondary"
                  key={index}
                  disabled={disabled}
                  onClick={() =>
                    move("choose-driver", { player: view.players[index].id })
                  }
                >
                  {view.players[index].name} tar bussen
                </button>
              ))}
            </div>
            <Actions>
              <button
                className="button primary"
                disabled={disabled}
                onClick={() => move("ride-together")}
              >
                Vi tar Bussruta sammen 🚌
              </button>
            </Actions>
          </>
        )}
        {roster}
      </BusFrame>
    );
  }

  if (view.phase === "deal") {
    const { deal, drivers } = view;
    const up = deal.player === me;
    const amount = deal.question + 1;
    const next = drivers[(drivers.indexOf(deal.player) + 1) % drivers.length];
    const last = deal.question === 3 && deal.player === drivers.at(-1);
    return (
      <BusFrame
        active={active}
        counter={`Bussruta · del 1 · kort ${amount} av 4 · spiller ${drivers.indexOf(deal.player) + 1} av ${drivers.length}`}
        player={view.players[deal.player]?.name}
        label={up ? "Din tur" : "Gjetter nå"}
      >
        <div className="bus-message">
          <h2>{questions[deal.question]}</h2>
          <p className="muted small">{guessHints[deal.question]}</p>
        </div>
        <Hand
          cards={deal.cards.map((card) => card ?? HIDDEN_CARD)}
          active={deal.question}
          revealed={deal.cards.filter(Boolean).length}
        />
        {deal.stage === "guess" ? (
          up ? (
            <Actions>
              {guesses[deal.question].map(([guess, label]) => (
                <button
                  key={guess}
                  className="button secondary"
                  disabled={disabled}
                  onClick={() => move("deal-guess", { guess })}
                >
                  {label}
                </button>
              ))}
            </Actions>
          ) : (
            <p className="action-hint">
              Venter på at {name(deal.player)} gjetter. Riktig gir bort{" "}
              {sips(amount)}, feil tar {sips(amount)}.
            </p>
          )
        ) : (
          <>
            <p
              className={`bus-feedback ${deal.correct ? "bus-correct" : "bus-wrong"}`}
              role="status"
            >
              {deal.correct
                ? deal.recipient === null
                  ? `Riktig! ${name(deal.player)} gir bort ${sips(amount)} 🍺`
                  : `${name(deal.recipient)} tar ${sips(amount)} 🍺`
                : `Feil! ${name(deal.player)} tar ${sips(amount)} 🍺`}
            </p>
            {deal.correct && deal.recipient === null ? (
              up ? (
                <>
                  <p className="bus-hand-hint">Hvem gir du slurkene til?</p>
                  {others(me, (recipient) => move("deal-award", { recipient }))}
                </>
              ) : (
                <p className="action-hint">
                  {name(deal.player)} velger hvem som drikker.
                </p>
              )
            ) : up || host ? (
              <Actions>
                <button
                  className="button primary"
                  disabled={disabled}
                  onClick={() => move("next-player")}
                >
                  {last
                    ? "Til Bussruta del 2 · pyramiden →"
                    : `Videre · ${view.players[next]?.name} sin tur →`}
                </button>
              </Actions>
            ) : (
              <p className="action-hint">
                {name(deal.player)} tar dere videre.
              </p>
            )}
          </>
        )}
      </BusFrame>
    );
  }

  const names = list(view.drivers.map(name));
  const { bus } = view;
  if (view.phase === "done")
    return (
      <BusFrame active={active} counter="H-en + Bussruta · endestasjon">
        <div className="bus-message">
          <span className="bus-finish-symbol" aria-hidden="true">
            {view.endReason === "cleared" ? "🎉" : "🚌"}
          </span>
          <h2>
            {view.endReason === "no-driver"
              ? "Alle tømte hånden!"
              : view.endReason === "cleared"
                ? "Dere kom til toppen!"
                : "Bussturen er avsluttet"}
          </h2>
          <p>
            {view.endReason === "no-driver"
              ? "Null kort igjen til noen. Alle slipper Bussruta."
              : `${names} · ${bus.attempt} forsøk · ${bus.failures} bildekort.`}
          </p>
        </div>
        {view.endReason === "cleared" && (
          <PyramidCards pyramid={bus.pyramid} row={bus.row} active={false} />
        )}
        <p className="action-hint">
          {host
            ? "Ta gjengen tilbake til lobbyen for en ny runde."
            : "Verten tar dere tilbake til lobbyen."}
        </p>
      </BusFrame>
    );

  const riding = view.drivers.includes(me);
  const canAct = riding || host;
  const penalty = pyramidPenalty(bus.row);
  return (
    <BusFrame
      active={active}
      counter={`Bussruta · del 2 · forsøk ${bus.attempt} · rad ${bus.row} av 5`}
      player={view.drivers.length > 1 ? "Busslaget" : names}
      label={
        view.drivers.length > 1
          ? `${view.drivers.length} spillere tar bussen sammen`
          : riding
            ? "Du er på Bussruta"
            : "På Bussruta"
      }
    >
      {view.drivers.length > 1 && (
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
            ? "Ett kort per rad, fra bunnen til toppen. Knekt, dame og konge sender bussen tilbake til start. Ess er trygt."
            : bus.stage === "pick"
              ? canAct
                ? "Den markerte raden er aktiv. Velg selv hvilket kort dere vil snu."
                : `${names} velger kort. Hold pusten.`
              : bus.failed
                ? penalty.shot
                  ? "Ta en shot 🥃"
                  : `Ta ${sips(penalty.sips)} 🍺`
                : "Ingen bildekort. Neste rad venter."}
        </p>
      </div>
      <PyramidCards
        pyramid={bus.pyramid}
        row={bus.row}
        active={bus.stage === "pick" && !disabled}
        onPick={canAct ? (index) => move("pick-pyramid", { index }) : undefined}
      />
      {canAct ? (
        <Actions>
          {bus.stage === "ready" ? (
            <button
              className="button primary"
              disabled={disabled}
              onClick={() => move("start-bus")}
            >
              Start pyramiden 🚌
            </button>
          ) : bus.stage === "feedback" ? (
            <button
              className="button primary"
              disabled={disabled}
              onClick={() => move(bus.failed ? "retry-bus" : "next-row")}
            >
              {bus.failed
                ? "Stokk hele pyramiden · prøv igjen ↻"
                : "Neste rad ↑"}
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
            disabled={disabled}
            onClick={() => move("skip-bus")}
          >
            Avslutt bussturen
          </button>
        </Actions>
      ) : (
        <p className="action-hint">{names} tar bussen. Heia!</p>
      )}
    </BusFrame>
  );
}
