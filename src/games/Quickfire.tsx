import { useState } from "react";
import { shuffle } from "../../shared/engine";
import { quickQuestions } from "../../shared/party-content";
import {
  quizStandings,
  timedAnswer,
  type QuizAttempt,
} from "../../shared/party-engine";
import type { PartyGameProps } from "./party-types";
import { Round, Next } from "./GameControls";
import { TaskCard, Timer, ScoreStrip } from "./PartyUI";
import { useCountdown } from "./useCountdown";
import { focusTimedRound } from "./party-focus";
export function Quickfire({ players, settings, onFinish }: PartyGameProps) {
  const [deck] = useState(() =>
    shuffle(quickQuestions).map((item) => ({
      ...item,
      options: shuffle(
        item.choices.map((text, i) => ({ text, correct: i === item.answer })),
      ),
    })),
  );
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const timer = useCountdown();
  const player = players[index % players.length];
  const question = deck[index];
  const rounds = Math.min(settings.rounds, deck.length);
  const [submitted, setSubmitted] = useState<QuizAttempt["outcome"] | null>(
    null,
  );
  const outcome = submitted ?? (timer.expired ? "timeout" : null);
  const { scores, streaks } = quizStandings(
    outcome ? [...attempts, { playerId: player.id, outcome }] : attempts,
  );
  return (
    <Round round={index + 1} rounds={rounds} player={player.name}>
      {timer.deadline !== null && (
        <Timer seconds={timer.remaining} total={settings.seconds} />
      )}
      <TaskCard label="Fire svar · én sjanse">
        {timer.deadline === null
          ? "Klar for et kjapt spørsmål?"
          : question.question}
      </TaskCard>
      {timer.deadline !== null && (
        <div className="quick-options">
          {question.options.map((option, i) => (
            <button
              key={option.text}
              className={`quick-option ${outcome && option.correct ? "option-correct" : ""} ${outcome && i === answer && !option.correct ? "option-wrong" : ""}`}
              disabled={!!outcome}
              onClick={() => {
                if (outcome || timer.deadline === null) return;
                const result = timedAnswer(timer.deadline, option.correct);
                setSubmitted(result);
                if (result !== "timeout") setAnswer(i);
              }}
            >
              <span>{String.fromCharCode(65 + i)}</span>
              {option.text}
            </button>
          ))}
        </div>
      )}
      {outcome && (
        <p className="result-message" role="status">
          {outcome === "correct"
            ? `Riktig! Ett poeng. Din serie: ${streaks[player.id]}.`
            : `${outcome === "timeout" ? "Tiden er ute!" : "Det ble bom."} Fasit: ${question.choices[question.answer]}. En valgfri slurk.`}
        </p>
      )}
      <div className="actions centered game-actions">
        {timer.deadline === null ? (
          <button
            className="button primary"
            onClick={() => {
              timer.start(settings.seconds);
              focusTimedRound();
            }}
          >
            Start spørsmålet · {settings.seconds} sek
          </button>
        ) : outcome ? (
          <Next
            last={index + 1 >= rounds}
            onClick={() => {
              if (index + 1 >= rounds) onFinish();
              else {
                setAttempts([...attempts, { playerId: player.id, outcome }]);
                setIndex(index + 1);
                setAnswer(null);
                setSubmitted(null);
                timer.reset();
              }
            }}
          />
        ) : (
          <button
            className="button secondary"
            onClick={() => setSubmitted(timedAnswer(timer.deadline!, false))}
          >
            Vet ikke / hopp over
          </button>
        )}
      </div>
      <ScoreStrip players={players} scores={scores} streaks={streaks} />
    </Round>
  );
}
