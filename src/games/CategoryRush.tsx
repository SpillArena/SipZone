import { useState } from "react";
import { shuffle } from "../../shared/engine";
import { rushCategories } from "../../shared/party-content";
import { normalizeAnswer } from "../../shared/party-engine";
import type { PartyGameProps } from "./party-types";
import { Round, Next } from "./GameControls";
import { TaskCard, Timer } from "./PartyUI";
import { useCountdown } from "./useCountdown";
import { focusTimedRound } from "./party-focus";
export function CategoryRush({ players, settings, onFinish }: PartyGameProps) {
  const [deck] = useState(() => shuffle(rushCategories));
  const [index, setIndex] = useState(0);
  const [holder, setHolder] = useState(0);
  const [words, setWords] = useState(0);
  const [failure, setFailure] = useState<string | null>(null);
  const [used, setUsed] = useState<string[]>([]);
  const [suggestion, setSuggestion] = useState(deck[0]);
  const [custom, setCustom] = useState(false);
  const [draft, setDraft] = useState("");
  const timer = useCountdown();
  const rounds = settings.rounds;
  const result = failure ?? (timer.expired ? "Tiden er ute!" : null);
  const player = players[holder];
  const category = custom ? draft.trim() : suggestion;
  const available = deck.filter(
    (item) => !used.includes(normalizeAnswer(item)),
  );
  const repeated = used.includes(normalizeAnswer(category));
  const valid = !!normalizeAnswer(category) && !repeated;
  const ready = timer.deadline === null;
  const lose = (reason: string) => {
    if (result) return;
    setFailure(
      timer.deadline !== null && Date.now() >= timer.deadline
        ? "Tiden er ute!"
        : reason,
    );
  };
  return (
    <Round
      round={index + 1}
      rounds={rounds}
      player={player.name}
      playerLabel={ready ? "Velg kategori og start" : undefined}
    >
      {!ready && <Timer seconds={timer.remaining} total={settings.seconds} />}
      <TaskCard
        label={
          ready
            ? "Velg noe hele gjengen kan bidra med"
            : "Si ett nytt ord i kategorien"
        }
      >
        {category || "Deres egen kategori"}
      </TaskCard>
      {ready && (
        <div className="rush-setup">
          <label className="field">
            Kategori
            <select
              id="rush-category"
              value={custom ? "custom" : suggestion}
              onChange={(event) => {
                setCustom(event.target.value === "custom");
                if (event.target.value !== "custom")
                  setSuggestion(event.target.value);
              }}
            >
              {available.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
              <option value="custom">Skriv en egen kategori …</option>
            </select>
          </label>
          {custom && (
            <label className="field">
              Deres kategori
              <input
                id="rush-custom"
                maxLength={80}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="For eksempel: ting i bilen vår"
              />
            </label>
          )}
          {repeated && (
            <p className="error" role="alert">
              Denne kategorien er allerede brukt. Velg en ny.
            </p>
          )}
          <p className="muted small">
            Den som velger begynner selv. Etter en feil velger taperen neste
            kategori, eller gir valget videre. Gjengen avgjør om et svar passer.
          </p>
          <button
            className="text-button"
            onClick={() => setHolder((holder + 1) % players.length)}
          >
            Gi kategorivalget til {players[(holder + 1) % players.length].name}{" "}
            →
          </button>
        </div>
      )}
      <p className="party-note muted">
        {words} godkjente ord denne runden.{" "}
        {ready
          ? "Start når spilleren er klar."
          : "Gjengen følger med på gjentakelser. Ved tvil avgjør de andre; likt stemmetall godkjenner svaret."}
      </p>
      {result && (
        <p className="result-message" role="status">
          {result} {player.name} kan ta en valgfri slurk og velger neste
          kategori.
        </p>
      )}
      <div className="actions centered game-actions">
        {result ? (
          <Next
            last={index + 1 >= rounds}
            onClick={() => {
              if (index + 1 >= rounds) onFinish();
              else {
                setIndex(index + 1);
                setWords(0);
                setFailure(null);
                setSuggestion(available[0]);
                setCustom(false);
                setDraft("");
                timer.reset();
              }
            }}
          />
        ) : ready ? (
          <button
            className="button primary"
            disabled={!valid}
            onClick={() => {
              if (!valid) return;
              setUsed([...used, normalizeAnswer(category)]);
              timer.start(settings.seconds);
              focusTimedRound();
            }}
          >
            Start runden · {settings.seconds} sek per tur
          </button>
        ) : (
          <>
            <button
              className="button primary"
              onClick={() => {
                if (timer.deadline !== null && Date.now() >= timer.deadline) {
                  timer.refresh();
                  return;
                }
                setWords(words + 1);
                setHolder((holder + 1) % players.length);
                timer.start(settings.seconds);
              }}
            >
              Godkjent – neste →
            </button>
            <button
              className="button secondary"
              onClick={() => lose("Det ordet er brukt!")}
            >
              Gjentakelse
            </button>
            <button
              className="text-button"
              onClick={() => lose("Svaret passer ikke kategorien.")}
            >
              Passer ikke kategorien
            </button>
            <button
              className="text-button"
              onClick={() => lose("Her stoppet det opp.")}
            >
              Stopp / hopp over
            </button>
          </>
        )}
      </div>
    </Round>
  );
}
