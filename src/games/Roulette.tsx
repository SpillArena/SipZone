import { useEffect, useRef, useState } from "react";
import { rouletteOutcomes } from "../../shared/content";
import type { Player } from "../../shared/engine";
import { useI18n } from "../i18n";
import { Round, Next } from "./GameControls";

export function Roulette({
  players,
  rounds,
  onFinish,
}: {
  players: Player[];
  rounds: number;
  onFinish: () => void;
}) {
  const [round, setRound] = useState(1);
  const [result, setResult] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [angle, setAngle] = useState(0);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const busy = useRef(false);
  const { t } = useI18n();
  useEffect(() => () => clearTimeout(timeout.current), []);
  const spin = () => {
    if (busy.current) return;
    busy.current = true;
    setSpinning(true);
    setResult(null);
    const chosen = Math.floor(Math.random() * rouletteOutcomes.length);
    setAngle(
      (previous) =>
        previous +
        1800 +
        ((360 - chosen * 45 - 22.5 - (previous % 360) + 360) % 360),
    );
    timeout.current = setTimeout(
      () => {
        setResult(chosen);
        setSpinning(false);
        busy.current = false;
      },
      matchMedia("(prefers-reduced-motion: reduce)").matches ? 100 : 2200,
    );
  };
  const outcome = result === null ? null : rouletteOutcomes[result];
  return (
    <Round
      round={round}
      rounds={rounds}
      player={players[(round - 1) % players.length].name}
    >
      <div className="roulette-wrap">
        <span className="wheel-pointer" aria-hidden="true">
          ▼
        </span>
        <div
          className="roulette-wheel"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          {rouletteOutcomes.map((item, index) => (
            <span
              key={item.label}
              className="wheel-symbol"
              style={{
                transform: `rotate(${index * 45 + 22.5}deg) translateY(calc(var(--wheel-size, 300px) * -0.3933)) rotate(-${index * 45 + 22.5}deg)`,
              }}
            >
              {item.symbol}
            </span>
          ))}
          <span className="wheel-hub" aria-hidden="true">
            S.
          </span>
        </div>
      </div>
      <div className="roulette-result" role="status">
        <h2>
          {spinning
            ? t("Skjebnen snurrer …", "Fate is spinning …")
            : (outcome?.label ?? t("Klar for et spinn?", "Ready for a spin?"))}
        </h2>
        <p className="muted">
          {outcome?.text ??
            t(
              "Trykk på knappen og la hjulet bestemme.",
              "Tap the button and let the wheel decide.",
            )}
        </p>
      </div>
      <div className="actions centered game-actions">
        {outcome ? (
          <Next
            onClick={() => {
              if (round >= rounds) onFinish();
              else {
                setRound(round + 1);
                setResult(null);
              }
            }}
            last={round >= rounds}
          />
        ) : (
          <button className="button primary" disabled={spinning} onClick={spin}>
            {t("Snurr hjulet", "Spin the wheel")} ✳
          </button>
        )}
      </div>
    </Round>
  );
}
