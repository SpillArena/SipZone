import { useState } from "react";
import { shuffle } from "../../shared/engine";
import { trainQuestions } from "../../shared/party-content";
import type { PartyGameProps } from "./party-types";
import { Round, Next } from "./GameControls";
import { TaskCard } from "./PartyUI";
export function TruthTrain({ players, settings, onFinish }: PartyGameProps) {
  const [deck] = useState(() => shuffle(trainQuestions));
  const [index, setIndex] = useState(0);
  const [followup, setFollowup] = useState(false);
  const [verdict, setVerdict] = useState<string | null>(null);
  const rounds = Math.min(settings.rounds, deck.length);
  return (
    <Round
      round={index + 1}
      rounds={rounds}
      player={players[index % players.length].name}
    >
      <div className="train-route" aria-hidden="true">
        {players.map((player, i) => (
          <span
            key={player.id}
            className={i === index % players.length ? "current-stop" : ""}
          >
            {i + 1}
          </span>
        ))}
      </div>
      <TaskCard label="Neste stopp: en god historie">{deck[index][0]}</TaskCard>
      {followup && (
        <div className="followup-card">
          <p className="eyebrow">Fortell litt mer</p>
          <h3>{deck[index][1]}</h3>
        </div>
      )}
      {verdict && (
        <p className="result-message" role="status">
          {verdict}
        </p>
      )}
      <div className="actions centered game-actions">
        {verdict ? (
          <Next
            last={index + 1 >= rounds}
            onClick={() => {
              if (index + 1 >= rounds) onFinish();
              else {
                setIndex(index + 1);
                setFollowup(false);
                setVerdict(null);
              }
            }}
          />
        ) : (
          <>
            <button
              className="button primary"
              onClick={() =>
                setVerdict("Gjengen godkjenner. Takk for historien!")
              }
            >
              Godkjent
            </button>
            <button
              className="button secondary"
              onClick={() =>
                setVerdict("En valgfri slurk, så går toget videre.")
              }
            >
              En slurk
            </button>
            <button
              className="text-button"
              disabled={followup}
              onClick={() => setFollowup(true)}
            >
              {followup ? "Oppfølgeren er fremme" : "Vis oppfølger"}
            </button>
            <button
              className="text-button"
              onClick={() =>
                setVerdict("Vi hopper over dette stoppet. Helt i orden.")
              }
            >
              Hopp over
            </button>
          </>
        )}
      </div>
    </Round>
  );
}
