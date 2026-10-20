import { useState } from "react";
import { Dialog } from "../../ui/Dialog";
import { BusHandDock } from "./BusHandDock";
import { BusAwardPopup } from "./BusAwardPopup";
import { BusPyramidFailure } from "./BusPyramidFailure";
import { BusEndScene } from "./BusEndScene";
import { Avatar, PlayerChip } from "./PlayerChip";
import { cardLabel, type Card } from "../../../shared/engine";
import { H_CARD_COUNT, hEffect, pyramidPenalty } from "../../../shared/bus";
import type { LiveBusView } from "../../../shared/live-bus";
import type { RoomView } from "../../../shared/rooms";
import {
  Actions,
  BusFrame,
  Hand,
  HCards,
  PyramidCards,
} from "../../games/BusRoute";
import {
  HIDDEN_CARD,
  busPhase,
  effectLabels,
  guessHints,
  guesses,
  sips,
} from "../../games/bus-copy";

type Send = (input: Record<string, unknown>) => Promise<boolean>;
const show = (card: Card) => `${cardLabel(card.rank)} ${card.suit}`;
/** "Ada, Emil og Siri" */
const list = (names: string[]) =>
  names.length < 2
    ? (names[0] ?? "")
    : `${names.slice(0, -1).join(", ")} og ${names.at(-1)}`;

/**
 * H-en + Bussruta with every player on their own phone.
 *
 * Cards rest at the bottom with their tops showing; matches rise automatically. The
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
  const [playError, setPlayError] = useState("");
  const [laying, setLaying] = useState<{
    card: Card;
    target: number;
  } | null>(null);
  const name = (index: number) =>
    `${view.players[index]?.name ?? "?"}${index === me ? " (deg)" : ""}`;
  const move = (type: string, extra: Record<string, unknown> = {}) =>
    send({ action: "bus", move: type, ...extra });
  const others = (actor: number, onChoose: (id: string) => void) => (
    <div className="bus-recipient-grid" role="group" aria-label="Velg spiller">
      {view.players.map(
        (player, index) =>
          index !== actor && (
            <button
              className="bus-recipient"
              key={player.id}
              disabled={disabled}
              onClick={() => onChoose(player.id)}
            >
              <PlayerChip name={player.name} size={64} />
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
    const canMatch = (card: Card) =>
      view.h.some((target) => target?.rank === card.rank);
    const matches = view.hand.filter(canMatch).length;
    const giveCards = view.hand.filter((card) => {
      const target = view.h.findLastIndex((hCard) => hCard?.rank === card.rank);
      return target >= 0 && hEffect(target) === "give";
    }).length;
    const target = laying
      ? Number.isInteger(laying.target) &&
        view.h[laying.target]?.rank === laying.card.rank
        ? laying.target
        : view.h.findLastIndex((card) => card?.rank === laying.card.rank)
      : -1;
    const pending =
      laying &&
      target >= 0 &&
      view.hand.some(
        (card) =>
          card.rank === laying.card.rank && card.suit === laying.card.suit,
      )
        ? { card: laying.card, target }
        : null;
    const play = async (card: Card, target: number, recipient?: string) => {
      if (disabled) return;
      if (view.h[target]?.rank !== card.rank) {
        setPlayError(
          "Kortet matcher ikke lenger. Lukk vinduet og velg kortet på nytt.",
        );
        return;
      }
      setPlayError("");
      const accepted = await move("play-card", {
        rank: card.rank,
        suit: card.suit,
        hIndex: target,
        ...(recipient ? { recipient } : {}),
      });
      if (accepted) setLaying(null);
      else setPlayError("Kortet ble ikke lagt. Prøv igjen.");
    };
    const choose = (card: Card) => {
      const target = view.h.findLastIndex((hCard) => hCard?.rank === card.rank);
      if (disabled || target < 0) return;
      setPlayError("");
      if (hEffect(target) === "give") setLaying({ card, target });
      else play(card, target);
    };
    return (
      <BusFrame
        active={active}
        counter={
          view.hIndex < 0
            ? "Behold de fire kortene fra gjetterunden · målet er null igjen"
            : `H-kort ${view.hIndex + 1} av ${H_CARD_COUNT} · ${effectLabels[effect!]}`
        }
      >
        <div className="bus-message">
          <h2>
            {view.hStage === "intro"
              ? "Fire gjetninger er ferdig. Nå spiller vi H-en."
              : current
                ? `${show(current)} · ${effectLabels[effect!]}`
                : `H-kort ${view.hIndex + 1} ligger klart`}
          </h2>
          <p>
            {view.hStage === "intro"
              ? "Kortene fra Fire gjetninger hviler nederst med toppen synlig. Trykk på dem for å vise hele hånden. Kort som kan spilles, løftes automatisk. Gi bort til venstre, ta selv til høyre, shots i midten."
              : !open
                ? host
                  ? "Trykk på det markerte kortet for å snu det."
                  : "Verten snur kortet."
                : matches
                  ? `Du har ${matches === 1 ? "en match" : `${matches} matcher`}! Trykk på kortet ditt for å legge det automatisk.`
                  : me >= 0 && view.hand.length
                    ? "Ingen match denne gangen."
                    : "Følg med på hvem som drikker."}
          </p>
        </div>
        {giveCards > 0 && (
          <div className="bus-personal-action" role="status">
            <p className="eyebrow">Du har kort som gir bort</p>
            <h3>Du kan dele ut {sips(giveCards)}</h3>
            <p>Trykk på et løftet kort og velg hvem som skal drikke.</p>
          </div>
        )}
        <HCards
          h={view.h}
          index={view.hIndex}
          canReveal={view.hStage === "covered" && !disabled}
          onReveal={host ? () => move("reveal-h") : undefined}
        />
        {view.plays.length > 0 && (
          <ul className="bus-plays" role="status">
            {view.plays.map((entry, index) => (
              <li key={index}>
                <strong>{name(entry.player)}</strong> legger {show(entry.card)}{" "}
                på H-kort {(entry.hIndex ?? view.hIndex) + 1} ·{" "}
                {hEffect(entry.hIndex ?? view.hIndex) === "give"
                  ? `${name(entry.recipient)} drikker 1 slurk 🍺`
                  : hEffect(entry.hIndex ?? view.hIndex) === "shot"
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
                    : "Neste H-kort →"}
            </button>
          </Actions>
        ) : (
          <p className="action-hint">Verten snur H-en.</p>
        )}
        {roster}
        {playError && !pending && (
          <p className="error" role="alert">
            {playError}
          </p>
        )}
        {me >= 0 && (
          <BusHandDock
            cards={view.hand}
            canPlay={canMatch}
            disabled={disabled}
            onChoose={choose}
          />
        )}
        {pending && (
          <Dialog
            title="Du skal dele ut 1 slurk"
            onClose={() => setLaying(null)}
          >
            {others(me, (recipient) =>
              play(pending.card, pending.target, recipient),
            )}
            {disabled && <p role="status">Legger kortet …</p>}
            {playError && (
              <p className="error" role="alert">
                {playError}
              </p>
            )}
            <button className="text-button" onClick={() => setLaying(null)}>
              Avbryt
            </button>
          </Dialog>
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
    const { deal } = view;
    const up = deal.player === me;
    const amount = deal.question + 1;
    const waiting = view.pendingDrinks?.[0];
    const highlighted = waiting ? waiting.player : deal.player;
    return (
      <div className="round-board bus-board bus-deal-board">
        <div className="bus-deal-progress">
          <strong>Fire gjetninger</strong>
          <span>Kort {amount} av 4</span>
          <div
            role="progressbar"
            aria-label="Gjetterunde"
            aria-valuemin={1}
            aria-valuemax={4}
            aria-valuenow={amount}
          >
            {[0, 1, 2, 3].map((index) => (
              <i
                key={index}
                className={index <= deal.question ? "is-complete" : ""}
              />
            ))}
          </div>
        </div>
        <div
          className={`bus-deal-turn ${highlighted === me ? "is-your-turn" : ""}`}
          key={`turn-${deal.player}-${deal.question}-${waiting ? "drink" : deal.stage}`}
          role="status"
          aria-live="polite"
        >
          <Avatar name={view.players[highlighted]?.name ?? "?"} size={32} />
          <strong>
            {waiting
              ? highlighted === me
                ? "Din drikkebekreftelse"
                : `Venter på ${view.players[highlighted]?.name}`
              : deal.stage === "feedback"
                ? `${view.players[deal.player]?.name} deler ut`
                : up
                  ? "Din tur"
                  : `Ser på ${view.players[deal.player]?.name}`}
          </strong>
        </div>
        <div
          className="bus-message bus-deal-question"
          key={`question-${deal.player}-${deal.question}`}
        >
          <h2>
            {
              [
                "Rød eller svart?",
                "Høyere eller lavere?",
                "Innenfor eller utenfor?",
                "Hvilken sort?",
              ][deal.question]
            }
          </h2>
          {(deal.question === 1 || deal.question === 2) && (
            <p className="muted small">
              {deal.question === 1
                ? "Sammenlign med kort 1"
                : "Mellom kort 1 og 2"}
            </p>
          )}
        </div>
        <div
          className="bus-deal-hand"
          role="group"
          aria-label={
            up ? "Dine kort" : `${view.players[deal.player]?.name} sine kort`
          }
        >
          {!up && (
            <p className="bus-deal-hand-owner">
              {view.players[deal.player]?.name} sine kort
            </p>
          )}
          <Hand
            key={`hand-${deal.player}-${deal.question}`}
            cards={deal.cards.map((card) => card ?? HIDDEN_CARD)}
            active={deal.question}
            revealed={deal.cards.filter(Boolean).length}
            compact
          />
        </div>
        {deal.stage === "feedback" && deal.correct === false && (
          <p
            className="bus-deal-wrong"
            role="status"
            key={`wrong-${deal.player}-${deal.question}`}
          >
            <span aria-hidden="true">✕</span> Feil svar
          </p>
        )}
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
            <p className="bus-deal-status">Du venter på tur.</p>
          )
        ) : deal.correct && deal.recipient === null ? (
          up ? (
            <BusAwardPopup
              key={`award-${deal.player}-${deal.question}`}
              amount={amount}
            >
              {others(me, async (recipient) => {
                setPlayError("");
                const accepted = await move("deal-award", { recipient });
                if (!accepted)
                  setPlayError(
                    "Slurkene ble ikke delt ut. Velg spilleren på nytt.",
                  );
              })}
              {disabled && <p role="status">Sender slurkene …</p>}
              {playError && (
                <p className="error" role="alert">
                  {playError}
                </p>
              )}
            </BusAwardPopup>
          ) : (
            <p className="bus-deal-status">
              Riktig! Velger hvem som får {sips(amount)}.
            </p>
          )
        ) : null}
        <details className="bus-deal-rules" key={`rules-${deal.question}`}>
          <summary>Regler for dette kortet</summary>
          <p>{guessHints[deal.question]}</p>
          <p>
            Riktig svar: del ut {sips(amount)}. Feil svar: ta {sips(amount)}.
          </p>
        </details>
      </div>
    );
  }

  const names = list(view.drivers.map(name));
  const { bus } = view;
  if (view.phase === "done")
    return <BusEndScene view={view} disabled={disabled} send={send} />;

  const riding = view.drivers.includes(me);
  const canAct = riding || host;
  const penalty = pyramidPenalty(bus.row);
  const failed = bus.stage === "feedback" && bus.failed;
  return (
    <BusFrame
      active={active}
      counter={`Pyramiden · forsøk ${bus.attempt} · rad ${bus.row} av 5`}
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
      {!failed && (
        <div className="bus-message">
          <h2>
            {bus.stage === "ready"
              ? "Unngå bildekortene"
              : bus.stage === "pick"
                ? bus.row > 1
                  ? `Trygt kort! Velg på rad ${bus.row}`
                  : `Velg ett kort på rad ${bus.row}`
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
      )}
      {failed ? (
        <BusPyramidFailure key={`${bus.attempt}-${bus.row}`} view={view} />
      ) : (
        <PyramidCards
          pyramid={bus.pyramid}
          row={bus.row}
          active={bus.stage === "pick" && !disabled}
          onPick={
            canAct ? (index) => move("pick-pyramid", { index }) : undefined
          }
          autoFocus
        />
      )}
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
          ) : !failed ? (
            <p className="action-hint">
              {penalty.shot
                ? "Bildekort på toppen = en shot 🥃"
                : `Bildekort på denne raden = ${sips(penalty.sips)} 🍺`}
            </p>
          ) : (
            <p className="action-hint">
              Bussen fortsetter når alle har bekreftet.
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
