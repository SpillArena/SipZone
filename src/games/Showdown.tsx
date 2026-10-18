import { useState } from "react";
import { shuffle, type Player } from "../../shared/engine";
import { showdownTasks } from "../../shared/party-content";
import { bracketStage } from "../../shared/party-engine";
import type { PartyGameProps } from "./party-types";
import { Round } from "./GameControls";
import { TaskCard } from "./PartyUI";
export function Showdown({ players, onFinish }: PartyGameProps) {
  const [stage, setStage] = useState(() => bracketStage(shuffle(players)));
  const [matchIndex, setMatchIndex] = useState(0);
  const [stageNumber, setStageNumber] = useState(1);
  const [winners, setWinners] = useState<Player[]>([]);
  const [winner, setWinner] = useState<Player | null>(null);
  const [champion, setChampion] = useState<Player | null>(null);
  const [completed, setCompleted] = useState(0);
  const [tasks] = useState(() => shuffle(showdownTasks));
  const [taskIndex, setTaskIndex] = useState(0);
  const duel = stage.matches[matchIndex];
  const advance = () => {
    if (!winner) return;
    const qualified = [...winners, winner];
    setCompleted(completed + 1);
    setWinner(null);
    setTaskIndex(taskIndex + 1);
    if (matchIndex + 1 < stage.matches.length) {
      setWinners(qualified);
      setMatchIndex(matchIndex + 1);
      return;
    }
    const next = [...qualified, ...stage.byes];
    if (next.length === 1) {
      setChampion(next[0]);
      return;
    }
    setStage(bracketStage(next));
    setStageNumber(stageNumber + 1);
    setMatchIndex(0);
    setWinners([]);
  };
  if (champion)
    return (
      <Round
        round={players.length - 1}
        rounds={players.length - 1}
        player={champion.name}
        playerLabel="Kveldens mester"
      >
        <div className="champion-stage">
          <span aria-hidden="true">🏆</span>
          <h2>{champion.name} vinner Sip Showdown!</h2>
          <p>{completed} dueller. Én mester. Applaus fra gjengen!</p>
        </div>
        <div className="actions centered game-actions">
          <button className="button primary" onClick={onFinish}>
            Se oppsummering
          </button>
        </div>
      </Round>
    );
  return (
    <Round
      round={completed + 1}
      rounds={players.length - 1}
      player={`${duel.first.name} mot ${duel.second.name}`}
      playerLabel="Duell på bordet"
    >
      <div className="duel-heading">
        <span>{duel.first.name}</span>
        <strong>VS</strong>
        <span>{duel.second.name}</span>
      </div>
      <TaskCard
        label={`${stage.matches.length === 1 && !stage.byes.length ? "Finale" : `Turnering · trinn ${stageNumber}`} · gjengen dømmer`}
      >
        {tasks[taskIndex % tasks.length]}
      </TaskCard>
      {stage.byes.length > 0 && (
        <p className="muted party-note">
          {stage.byes[0].name} går rett videre dette trinnet.
        </p>
      )}
      {winner && (
        <p className="result-message" role="status">
          {winner.name} går videre!{" "}
          {winner.id === duel.first.id ? duel.second.name : duel.first.name} kan
          ta en valgfri slurk.
        </p>
      )}
      <div className="actions centered game-actions">
        {winner ? (
          <button className="button primary" onClick={advance}>
            Neste duell →
          </button>
        ) : (
          <>
            <button
              className="button primary"
              onClick={() => setWinner(duel.first)}
            >
              {duel.first.name} vant
            </button>
            <button
              className="button secondary"
              onClick={() => setWinner(duel.second)}
            >
              {duel.second.name} vant
            </button>
            <button
              className="text-button"
              onClick={() => setTaskIndex(taskIndex + 1)}
            >
              Uavgjort / ny oppgave
            </button>
          </>
        )}
      </div>
      <div className="tournament-progress">
        <p className="eyebrow">Videre i turneringen</p>
        <p>
          {[...winners, ...(winner ? [winner] : []), ...stage.byes]
            .map((p) => p.name)
            .join(" · ") || "Duellene avgjør hvem som går videre."}
        </p>
      </div>
    </Round>
  );
}
