import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import type { Card } from "../../shared/engine";
import { cardLabel } from "../../shared/engine";
import { useI18n } from "../i18n";

export function TurnBanner({
  player,
  label,
  isYou = false,
}: {
  player: string;
  label?: string;
  isYou?: boolean;
}) {
  const { t } = useI18n();
  const initials = player
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => Array.from(part)[0])
    .join("");
  return (
    <div
      className={`turn-banner${isYou ? " is-your-turn" : ""}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="turn-avatar" aria-hidden="true">
        {initials}
      </span>
      <div className="turn-copy">
        <span className="turn-label">
          {label ??
            (isYou ? t("Din tur!", "Your turn!") : t("Nå er det", "Up now"))}
        </span>
        <strong className="turn-name">
          <span className="turn-player-name">{player}</span>
          {!label && !isYou && (
            <span className="turn-suffix">{t("sin tur", "to play")}</span>
          )}
        </strong>
      </div>
      <span className="turn-symbol" aria-hidden="true">
        ↗
      </span>
    </div>
  );
}

export function Round({
  round,
  rounds,
  player,
  playerLabel,
  children,
}: {
  round: number;
  rounds: number;
  player?: string;
  playerLabel?: string;
  children: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="round-board">
      <div className="round-meta">
        <span>
          {t("Runde", "Round")} {round} / {rounds}
        </span>
        {!player && <span>{t("Hele gjengen", "Everyone")}</span>}
      </div>
      <div className="progress-track">
        <span style={{ width: `${(round / rounds) * 100}%` }} />
      </div>
      {player && <TurnBanner player={player} label={playerLabel} />}
      {children}
    </div>
  );
}

export function Next({
  onClick,
  last = false,
}: {
  onClick: () => void;
  last?: boolean;
}) {
  const { t } = useI18n();
  return (
    <button className="button primary" onClick={onClick}>
      {last
        ? t("Se oppsummering", "Finish round")
        : t("Neste runde", "Next round")}
      <ArrowRight size={18} />
    </button>
  );
}

export function PlayingCard({
  card,
  back = false,
}: {
  card: Card;
  back?: boolean;
}) {
  return (
    <div
      className={`playing-card ${back ? "card-back" : ""} ${card.suit === "♥" || card.suit === "♦" ? "red-card" : ""}`}
      aria-label={back ? "Skjult kort" : `${cardLabel(card.rank)} ${card.suit}`}
    >
      {back ? (
        <span>S.</span>
      ) : (
        <>
          <span className="rank top-rank">
            {cardLabel(card.rank)}
            <small>{card.suit}</small>
          </span>
          <span className="big-suit">{card.suit}</span>
          <span className="rank bottom-rank">
            {cardLabel(card.rank)}
            <small>{card.suit}</small>
          </span>
        </>
      )}
    </div>
  );
}
