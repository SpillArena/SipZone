import { useState } from "react";
import { shuffle } from "../../shared/engine";
import { boxTasks } from "../../shared/party-content";
import type { PartyGameProps } from "./party-types";
import { Round, Next } from "./GameControls";
import { TaskCard } from "./PartyUI";
export function PassBox({ players, settings, onFinish }: PartyGameProps) {
  const [deck] = useState(() => shuffle(boxTasks));
  const [index, setIndex] = useState(0);
  const [holder, setHolder] = useState(0);
  const [open, setOpen] = useState(false);
  const next = players[(holder + 1) % players.length];
  const rounds = Math.min(settings.rounds, deck.length);
  return (
    <Round
      round={index + 1}
      rounds={rounds}
      player={players[holder].name}
      playerLabel="Boksen er hos"
    >
      <div
        className={`snus-stage ${open ? "box-open" : ""}`}
        aria-hidden="true"
      >
        <div className="snus-base">✳</div>
        <div className="snus-lid">
          <small>SPILLARENA</small>
          <strong>
            SIP
            <br />
            BOX
          </strong>
          <small>ÅPNE FOR GOD STEMNING</small>
        </div>
      </div>
      <TaskCard label={open ? "Du åpnet boksen" : "En boks full av påfunn"}>
        {open ? deck[index] : "Åpne selv, eller send spenningen videre."}
      </TaskCard>
      <div className="actions centered game-actions">
        {!open ? (
          <>
            <button className="button primary" onClick={() => setOpen(true)}>
              Åpne boksen
            </button>
            <button
              className="button secondary"
              onClick={() => setHolder((holder + 1) % players.length)}
            >
              Send til {next.name} →
            </button>
          </>
        ) : (
          <>
            <Next
              last={index + 1 >= rounds}
              onClick={() => {
                if (index + 1 >= rounds) onFinish();
                else {
                  setIndex(index + 1);
                  setHolder((holder + 1) % players.length);
                  setOpen(false);
                }
              }}
            />
            <p className="muted small action-hint">
              Gjør oppgaven eller hopp over. Lukk boksen og gå videre.
            </p>
          </>
        )}
      </div>
    </Round>
  );
}
