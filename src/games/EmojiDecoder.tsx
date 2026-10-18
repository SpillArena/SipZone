import { useState } from "react";
import { shuffle } from "../../shared/engine";
import { emojiPuzzles } from "../../shared/party-content";
import { matchesAnswer } from "../../shared/party-engine";
import type { PartyGameProps } from "./party-types";
import { Round, Next } from "./GameControls";
import { ScoreStrip } from "./PartyUI";
export function EmojiDecoder({ players, settings, onFinish }: PartyGameProps) {
  const [deck] = useState(() => shuffle(emojiPuzzles));
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [tries, setTries] = useState(0);
  const [outcome, setOutcome] = useState<"correct" | "reveal" | "skip" | null>(
    null,
  );
  const [scores, setScores] = useState<Record<string, number>>({});
  const puzzle = deck[index];
  const player = players[index % players.length];
  const rounds = Math.min(settings.rounds, deck.length);
  const accept = () => {
    if (outcome === "correct" || outcome === "skip") return;
    setOutcome("correct");
    setScores({ ...scores, [player.id]: (scores[player.id] ?? 0) + 1 });
  };
  return (
    <Round round={index + 1} rounds={rounds} player={player.name}>
      <div className="emoji-puzzle">
        <p className="eyebrow">{puzzle.topic}</p>
        <div className="emoji-rebus" role="img" aria-label={puzzle.emoji}>
          {puzzle.emoji}
        </div>
        <h2>Hva skjuler seg her?</h2>
      </div>
      {!outcome && (
        <form
          id="emoji-answer"
          className="emoji-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!input.trim() || outcome) return;
            if (
              matchesAnswer(input, [puzzle.answer, ...(puzzle.aliases ?? [])])
            )
              accept();
            else {
              setTries(tries + 1);
              if (tries >= 1) setOutcome("reveal");
            }
          }}
        >
          <label htmlFor="emoji-guess">Svaret ditt</label>
          <input
            id="emoji-guess"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            autoComplete="off"
            maxLength={100}
            placeholder="Skriv det du tror …"
          />
          <p className="muted small" role="status">
            {tries
              ? "Ikke helt. Du har ett forsøk igjen."
              : "To forsøk. Gruppen kan hjelpe deg."}
          </p>
        </form>
      )}
      {outcome && (
        <div className="emoji-answer" role="status">
          <p className="eyebrow">
            {outcome === "correct"
              ? "Riktig! +1 poeng"
              : outcome === "skip"
                ? "Vi hopper over"
                : "Fasit · en valgfri slurk"}
          </p>
          <h2>{puzzle.answer}</h2>
        </div>
      )}
      <div className="actions centered game-actions">
        {outcome ? (
          <>
            {outcome === "reveal" && (
              <button className="button secondary" onClick={accept}>
                Vi hadde rett · godkjenn
              </button>
            )}
            <Next
              last={index + 1 >= rounds}
              onClick={() => {
                if (index + 1 >= rounds) onFinish();
                else {
                  setIndex(index + 1);
                  setInput("");
                  setTries(0);
                  setOutcome(null);
                }
              }}
            />
          </>
        ) : (
          <>
            <button
              className="button primary"
              type="submit"
              form="emoji-answer"
              disabled={!input.trim()}
            >
              Sjekk svaret
            </button>
            <button
              className="button secondary"
              onClick={() => setOutcome("reveal")}
            >
              Vis fasit
            </button>
            <button className="text-button" onClick={() => setOutcome("skip")}>
              Hopp over
            </button>
          </>
        )}
      </div>
      <ScoreStrip players={players} scores={scores} />
    </Round>
  );
}
