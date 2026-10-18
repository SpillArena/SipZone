import { useEffect, useRef, useState } from "react";
import { shuffle } from "../../shared/engine";
import { bottleQuestions } from "../../shared/party-content";
import { bottleRotation, darePool } from "../../shared/party-engine";
import { BottleGraphic } from "../ui/GameArt";
import type { PartyGameProps } from "./party-types";
import { Round, Next } from "./GameControls";
import { TaskCard } from "./PartyUI";
export function SpinBottle({ players, settings, onFinish }: PartyGameProps) {
  const [questions] = useState(() => shuffle(bottleQuestions));
  const [dares] = useState(() => shuffle(darePool("all", "easy")));
  const [index, setIndex] = useState(0);
  const [angle, setAngle] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [choice, setChoice] = useState<"question" | "dare" | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const busy = useRef(false);
  useEffect(() => () => clearTimeout(timeout.current), []);
  const spin = () => {
    if (busy.current || selected !== null) return;
    busy.current = true;
    setSpinning(true);
    const seat = Math.floor(Math.random() * players.length);
    setAngle(bottleRotation(angle, seat, players.length));
    timeout.current = setTimeout(
      () => {
        setSelected(seat);
        setSpinning(false);
        busy.current = false;
      },
      matchMedia("(prefers-reduced-motion: reduce)").matches ? 100 : 2200,
    );
  };
  return (
    <Round
      round={index + 1}
      rounds={settings.rounds}
      player={selected === null ? undefined : players[selected].name}
    >
      <details
        className={`bottle-overview ${choice ? "has-task" : ""}`}
        open={choice === null}
      >
        <summary>Flaske og spillerplasser</summary>
        <div className="bottle-table" aria-label="Spillerplasser rundt flasken">
          <div className="bottle-ring" aria-hidden="true">
            {players.map((player, i) => {
              const radians = (i / players.length) * Math.PI * 2;
              return (
                <span
                  key={player.id}
                  className={`bottle-seat ${selected === i ? "selected-seat" : ""}`}
                  style={{
                    left: `${50 + 44 * Math.sin(radians)}%`,
                    top: `${50 - 44 * Math.cos(radians)}%`,
                  }}
                >
                  {i + 1}
                </span>
              );
            })}
            <div
              className={`spinning-bottle ${spinning ? "is-spinning" : ""}`}
              style={{ transform: `translate(-50%, -50%) rotate(${angle}deg)` }}
            >
              <BottleGraphic />
            </div>
          </div>
        </div>
        <ol className="bottle-roster">
          {players.map((player, i) => (
            <li
              key={player.id}
              className={selected === i ? "selected-seat" : ""}
            >
              <span>{i + 1}</span>
              {player.name}
            </li>
          ))}
        </ol>
      </details>
      {selected === null ? (
        <p className="party-note" role="status">
          {spinning ? "Flasken bestemmer …" : "Hvem havner i rampelyset?"}
        </p>
      ) : choice ? (
        <TaskCard
          label={
            choice === "question"
              ? "Svar høyt, eller hopp over"
              : "En liten utfordring"
          }
        >
          {choice === "question" ? questions[index] : dares[index].text}
        </TaskCard>
      ) : (
        <p className="party-note">
          Flasken peker på {players[selected].name}. Velg ditt kort!
        </p>
      )}
      <div className="actions centered game-actions">
        {selected === null ? (
          <button className="button primary" disabled={spinning} onClick={spin}>
            {spinning ? "Snurrer …" : "Snurr flasken"}
          </button>
        ) : choice === null ? (
          <>
            <button
              className="button primary"
              onClick={() => setChoice("question")}
            >
              Et spørsmål
            </button>
            <button
              className="button secondary"
              onClick={() => setChoice("dare")}
            >
              En utfordring
            </button>
          </>
        ) : (
          <>
            <Next
              last={index + 1 >= settings.rounds}
              onClick={() => {
                if (index + 1 >= settings.rounds) onFinish();
                else {
                  setIndex(index + 1);
                  setSelected(null);
                  setChoice(null);
                }
              }}
            />
            <p className="muted small action-hint">
              Svar, gjennomfør, ta en valgfri slurk eller hopp over før dere går
              videre.
            </p>
          </>
        )}
      </div>
    </Round>
  );
}
