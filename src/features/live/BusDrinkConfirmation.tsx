import { useEffect, useState } from "react";
import type { LiveBusView } from "../../../shared/live-bus";
import { Dialog } from "../../ui/Dialog";
import { PYRAMID_DRINK_DELAY_MS, sips } from "../../games/bus-copy";
import { PlayingCard } from "../../games/GameControls";
import { cardLabel } from "../../../shared/engine";
import { PlayerChip } from "./PlayerChip";

export function BusDrinkConfirmation({
  view,
  disabled,
  send,
}: {
  view: LiveBusView;
  disabled: boolean;
  send: (input: Record<string, unknown>) => Promise<boolean>;
}) {
  const [error, setError] = useState("");
  const pending = view.pendingDrinks ?? [];
  const pyramidFailure = view.phase === "bus" && view.bus.failed;
  const wrongGuess =
    view.phase === "deal" &&
    view.deal.stage === "feedback" &&
    view.deal.correct === false;
  const delayedId = pyramidFailure
    ? `${view.bus.attempt}-${view.bus.row}`
    : wrongGuess
      ? `guess:${view.deal.player}-${view.deal.question}`
      : null;
  const delay = pyramidFailure ? PYRAMID_DRINK_DELAY_MS : 2000;
  const [revealedEvent, setRevealedEvent] = useState<string | null>(null);
  useEffect(() => {
    if (!delayedId) return;
    const timer = setTimeout(() => setRevealedEvent(delayedId), delay);
    return () => clearTimeout(timer);
  }, [delayedId, delay]);
  const mine = pending.find((drink) => drink.player === view.you);
  if (!pending.length) return null;
  if (delayedId && revealedEvent !== delayedId) return null;
  // The compact guessing board already shows who is confirming.
  if (!mine && view.phase === "deal") return null;
  if (!mine)
    return (
      <div className="bus-drink-wait" role="status">
        Venter på at{" "}
        {pending.map((drink) => view.players[drink.player]?.name).join(" og ")}{" "}
        bekrefter å ha drukket.
      </div>
    );
  const amount = mine.shots
    ? `${mine.shots} ${mine.shots === 1 ? "shot" : "shots"}`
    : sips(mine.sips);
  const hit = pyramidFailure
    ? view.bus.pyramid[view.bus.picks.at(-1) ?? -1]
    : wrongGuess
      ? view.deal.cards[view.deal.question]
      : null;
  const sender = mine.from !== null ? view.players[mine.from]?.name : null;
  return (
    <Dialog
      key={mine.id}
      title={
        sender
          ? "Du må drikke"
          : mine.sips === 1
            ? "Ta en slurk"
            : mine.shots === 1
              ? "Ta en shot"
              : `Ta ${amount}`
      }
      dismissible={false}
    >
      <div className="bus-drink-confirmation">
        {sender && (
          <div className="bus-drink-sender">
            <PlayerChip name={sender} size={64} />
            <p>sender deg {mine.sips} sip</p>
          </div>
        )}
        {hit && (
          <div className={`bus-drink-hit${wrongGuess ? " is-wrong" : ""}`}>
            <PlayingCard card={hit} />
            <p>
              {wrongGuess
                ? "Feil svar"
                : `${cardLabel(hit.rank)} ${hit.suit} · rad ${view.bus.row}`}
            </p>
          </div>
        )}
        {pyramidFailure && <p>Pyramiden er tilbake på rad 1.</p>}
        <button
          className="button primary"
          disabled={disabled}
          onClick={async () => {
            setError("");
            const accepted = await send({
              action: "bus",
              move: "confirm-drink",
              drinkId: mine.id,
            });
            if (!accepted)
              setError("Bekreftelsen ble ikke registrert. Prøv igjen.");
          }}
        >
          {disabled ? "Bekrefter …" : "Jeg har drukket"}
        </button>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </div>
    </Dialog>
  );
}
