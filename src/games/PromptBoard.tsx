import { useState } from "react";
import { SkipForward } from "lucide-react";
import type { PromptGame } from "../../shared/catalog";
import { promptDeck, voteResults } from "../../shared/engine";
import type { Player } from "../../shared/engine";
import type { GameSettings } from "../features/Setup";
import { useI18n } from "../i18n";
import { Round, Next, TurnBanner } from "./GameControls";

export function PromptBoard({
  game,
  players,
  settings,
  onFinish,
}: {
  game: PromptGame;
  players: Player[];
  settings: GameSettings;
  onFinish: () => void;
}) {
  const [deck] = useState(() =>
    promptDeck(game, settings.category).slice(0, settings.rounds),
  );
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const { t } = useI18n();
  const next = () => {
    if (index + 1 >= deck.length) onFinish();
    else {
      setIndex(index + 1);
      setAnswer("");
    }
  };
  const prompt = deck[index];
  return (
    <Round
      round={index + 1}
      rounds={deck.length}
      player={
        game === "truth" ? players[index % players.length].name : undefined
      }
    >
      <div className="prompt-card" key={`card-${prompt.id}`}>
        <span className="card-corner" aria-hidden="true">
          {game === "truth" ? "♥" : game === "never" ? "“" : "☞"}
        </span>
        <p className="eyebrow">
          {game === "truth"
            ? "Ærlig talt."
            : game === "never"
              ? "Jeg? Aldri."
              : "Hvem av dere?"}
        </p>
        <h2>{prompt.text}</h2>
        <span className="card-brand" aria-hidden="true">
          SIPZONE ♦
        </span>
      </div>
      {game === "truth" && (
        <>
          <p className="play-hint">
            {t(
              "Svar høyt, eller ta en slurk. Du bestemmer.",
              "Answer out loud, or take a sip. Your choice.",
            )}
          </p>
          {!answer ? (
            <div className="actions centered game-actions">
              <button
                className="button primary"
                onClick={() =>
                  setAnswer("Takk for ærligheten. Gjengen lytter!")
                }
              >
                {t("Jeg svarer", "I’ll answer")}
              </button>
              <button
                className="button secondary"
                onClick={() => setAnswer("En slurk, og hemmeligheten er din.")}
              >
                {t("Jeg tar en slurk", "I’ll sip")}
              </button>
            </div>
          ) : (
            <>
              <p className="result-message" role="status">
                {answer}
              </p>
              <div className="actions centered game-actions">
                <Next onClick={next} last={index + 1 === deck.length} />
              </div>
            </>
          )}
        </>
      )}
      {game === "never" && (
        <>
          <p className="play-hint">
            {t(
              "Gjort det? Ta en slurk. Ingen forklaring nødvendig.",
              "Done it? Take a sip. No explanation needed.",
            )}
          </p>
          <div className="actions centered game-actions">
            <Next onClick={next} last={index + 1 === deck.length} />
          </div>
        </>
      )}
      {game === "most-likely" &&
        (settings.voting === "secret" ? (
          <Ballot
            key={`ballot-${prompt.id}`}
            players={players}
            onNext={next}
            last={index + 1 === deck.length}
          />
        ) : (
          <>
            <p className="play-hint">
              {t(
                "3, 2, 1 … pek! Flest fingre tar en slurk. Ved likt deler dere.",
                "3, 2, 1 … point! Most fingers takes a sip. Ties share.",
              )}
            </p>
            <div className="actions centered game-actions">
              <Next onClick={next} last={index + 1 === deck.length} />
            </div>
          </>
        ))}
      <button className="text-button skip-button" onClick={next}>
        <SkipForward size={14} />
        {t("Hopp over", "Skip")}
      </button>
    </Round>
  );
}

function Ballot({
  players,
  onNext,
  last,
}: {
  players: Player[];
  onNext: () => void;
  last: boolean;
}) {
  const [votes, setVotes] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);
  const count = Object.keys(votes).length;
  const { t } = useI18n();
  if (count === players.length) {
    const result = voteResults(players, votes);
    return (
      <div className="vote-area">
        <h3>
          {result.winners.map((player) => player.name).join(" & ")}
          {t(" tar en slurk!", " takes a sip!")}
        </h3>
        <p className="muted small">
          {t("Stemmene er anonyme.", "The votes are anonymous.")}
        </p>
        <div className="vote-results">
          {players.map((player) => (
            <div key={player.id}>
              <span>{player.name}</span>
              <strong>{result.counts[player.id]}</strong>
            </div>
          ))}
        </div>
        <div className="actions centered game-actions">
          <Next onClick={onNext} last={last} />
        </div>
      </div>
    );
  }
  const voter = players[count];
  return (
    <div className="vote-area">
      <p className="small muted">
        {t("Stemme", "Vote")} {count + 1} / {players.length}
      </p>
      <TurnBanner
        player={voter.name}
        label={
          ready
            ? t("Du stemmer nå", "Your vote")
            : t("Gi mobilen til", "Pass the phone to")
        }
      />
      {!ready ? (
        <>
          <p className="muted small">
            {t(
              "De andre ser bort. Ingen tidligere stemmer vises.",
              "Everyone else looks away. Previous votes stay hidden.",
            )}
          </p>
          <div className="actions centered game-actions">
            <button className="button primary" onClick={() => setReady(true)}>
              {t("Jeg er", "I am")} {voter.name}
            </button>
          </div>
        </>
      ) : (
        <>
          <h3>{t("Hvem stemmer du på?", "Who gets your vote?")}</h3>
          <div className="vote-options">
            {players.map((player) => (
              <button
                className="button secondary"
                key={player.id}
                onClick={() => {
                  setVotes({ ...votes, [voter.id]: player.id });
                  setReady(false);
                }}
              >
                {player.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
