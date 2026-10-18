import { useState } from "react";
import { cardDeck, type Player } from "../../shared/engine";
import {
  initialHigherLower,
  playHigherLower,
  type HigherLowerAction,
  type HigherLowerOptions,
} from "../../shared/higher-lower";
import { useI18n } from "../i18n";
import { Round, Next, PlayingCard } from "./GameControls";
import { ScoreStrip } from "./PartyUI";
export function HigherLower({
  players,
  rounds,
  options,
  onFinish,
}: {
  players: Player[];
  rounds: number;
  options: Omit<HigherLowerOptions, "rounds">;
  onFinish: () => void;
}) {
  const [deck] = useState(() => cardDeck());
  const [state, setState] = useState(initialHigherLower);
  const { t } = useI18n();
  const player = players[state.turn % players.length];
  const last = state.cursor === deck.length - 1;
  const canContinue =
    options.mode === "streak" &&
    (state.result === "correct" || state.result === "tie") &&
    !last;
  const act = (action: HigherLowerAction) => {
    const next = playHigherLower(
      state,
      action,
      deck,
      players.map((item) => item.id),
      { ...options, rounds },
    );
    if (next.finished) onFinish();
    else setState(next);
  };
  const title =
    state.result === "banked"
      ? `${state.secured} poeng sikret!`
      : state.result === "wrong"
        ? options.mode === "streak"
          ? "Bom! Rekken er tapt."
          : t("Bom! Ta en slurk.", "Miss! Take a sip.")
        : state.result === "tie"
          ? t("Likt! Du slipper unna.", "A tie! You’re safe.")
          : state.result === "correct"
            ? options.mode === "streak" && !last
              ? `Riktig! ${state.pending} poeng i potten.`
              : `Riktig! ${state.secured} poeng sikret.`
            : t("Høyere eller lavere?", "Higher or lower?");
  return (
    <Round round={state.turn + 1} rounds={rounds} player={player.name}>
      <div className="higher-cards">
        <PlayingCard card={deck[state.cursor - 1]} />
        <span className="cards-divider">↔</span>
        <PlayingCard card={deck[state.cursor]} back={state.result === null} />
      </div>
      <div className="roulette-result" role="status">
        <h2>{title}</h2>
        <p className="muted small">
          Ess er {options.ace === "high" ? "høyest (14)" : "lavest (1)"}. Like
          kort{" "}
          {options.ties === "lose" ? "teller som feil." : "gir ingen straff."}
        </p>
        {options.mode === "streak" && (
          <p className="streak-pot">
            <strong>{state.pending}</strong> usikrede poeng ·{" "}
            {state.scores[player.id] ?? 0} sikret
          </p>
        )}
        {state.result === "wrong" && (
          <p className="muted small">
            En valgfri slurk. Sikrede poeng beholder du.
          </p>
        )}
        {last && state.result !== null ? (
          <p className="muted small">
            Stokken er tom. Eventuelle riktige poeng fra siste kort er sikret
            automatisk.
          </p>
        ) : (
          <p className="muted small">
            {52 - state.cursor - (state.result === null ? 0 : 1)} kort igjen
            etter kortet på bordet.
          </p>
        )}
      </div>
      <div className="actions centered game-actions">
        {state.result === null ? (
          <>
            <button
              className="button primary"
              onClick={() => act({ type: "guess", direction: "higher" })}
            >
              ↑ {t("Høyere", "Higher")}
            </button>
            <button
              className="button secondary"
              onClick={() => act({ type: "guess", direction: "lower" })}
            >
              ↓ {t("Lavere", "Lower")}
            </button>
          </>
        ) : canContinue ? (
          <>
            <button
              className="button primary"
              onClick={() => act({ type: "bank" })}
            >
              Sikre {state.pending} poeng
            </button>
            <button
              className="button secondary"
              onClick={() => act({ type: "continue" })}
            >
              Ta sjansen igjen →
            </button>
          </>
        ) : (
          <Next
            last={last || state.turn + 1 >= rounds}
            onClick={() => act({ type: "next" })}
          />
        )}
      </div>
      <ScoreStrip players={players} scores={state.scores} />
    </Round>
  );
}
