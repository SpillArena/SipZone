import { useState } from "react";
import { shuffle } from "../../shared/engine";
import { darePool } from "../../shared/party-engine";
import type { PartyGameProps } from "./party-types";
import { Round, Next } from "./GameControls";
import { TaskCard } from "./PartyUI";
export function SipDare({ players, settings, onFinish }: PartyGameProps) {
  const [deck] = useState(() =>
    shuffle(darePool(settings.category, settings.level)),
  );
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<"dare" | "sip" | "done" | "skip" | null>(
    null,
  );
  const rounds = Math.min(settings.rounds, deck.length);
  return (
    <Round
      round={index + 1}
      rounds={rounds}
      player={players[index % players.length].name}
    >
      <TaskCard
        label={
          settings.level === "bold"
            ? "Modig · litt mer rampelys"
            : "Rolig · bare god stemning"
        }
      >
        {choice === "dare"
          ? deck[index].text
          : choice === "sip"
            ? "En valgfri slurk. Skål!"
            : choice === "done"
              ? "Den satt. Gi gjengen en high five!"
              : choice === "skip"
                ? "Helt i orden. Turen går videre."
                : "En slurk eller en utfordring?"}
      </TaskCard>
      <p className="muted party-note">
        {rounds < settings.rounds
          ? `${rounds} unike oppgaver i dette utvalget. `
          : ""}
        Du kan alltid ombestemme deg.
      </p>
      <div className="actions centered game-actions">
        {choice === null ? (
          <>
            <button
              className="button secondary"
              onClick={() => setChoice("sip")}
            >
              Jeg tar en slurk
            </button>
            <button
              className="button primary"
              onClick={() => setChoice("dare")}
            >
              Gi meg en utfordring
            </button>
            <button className="text-button" onClick={() => setChoice("skip")}>
              Hopp over
            </button>
          </>
        ) : choice === "dare" ? (
          <>
            <button
              className="button primary"
              onClick={() => setChoice("done")}
            >
              Gjennomført!
            </button>
            <button
              className="button secondary"
              onClick={() => setChoice("sip")}
            >
              En slurk i stedet
            </button>
            <button className="text-button" onClick={() => setChoice("skip")}>
              Hopp over
            </button>
          </>
        ) : (
          <Next
            last={index + 1 >= rounds}
            onClick={() => {
              if (index + 1 >= rounds) onFinish();
              else {
                setIndex(index + 1);
                setChoice(null);
              }
            }}
          />
        )}
      </div>
    </Round>
  );
}
