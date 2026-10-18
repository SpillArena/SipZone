import type { ReactNode } from "react";
import type { Player } from "../../shared/engine";
export function TaskCard({
  label,
  children,
  footer,
}: {
  label: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="prompt-card party-task">
      <p className="eyebrow">{label}</p>
      <h2>{children}</h2>
      {footer && <div className="task-footer">{footer}</div>}
    </div>
  );
}
export function ScoreStrip({
  players,
  scores,
  streaks,
}: {
  players: Player[];
  scores: Record<string, number>;
  streaks?: Record<string, number>;
}) {
  return (
    <ul className="score-strip" aria-label="Poengoversikt">
      {players.map((player) => (
        <li key={player.id}>
          <span>
            {player.name}
            {streaks && <small>Serie: {streaks[player.id] ?? 0}</small>}
          </span>
          <strong>
            {scores[player.id] ?? 0}
            <span className="sr-only"> poeng</span>
          </strong>
        </li>
      ))}
    </ul>
  );
}
export function Timer({ seconds, total }: { seconds: number; total: number }) {
  return (
    <div
      className={`party-timer ${seconds <= 3 ? "timer-urgent" : ""}`}
      role="timer"
      aria-label={`${seconds} sekunder igjen`}
    >
      <div className="timer-track">
        <span style={{ width: `${Math.min(100, (seconds / total) * 100)}%` }} />
      </div>
      <strong>
        {seconds}
        <small>sek</small>
      </strong>
    </div>
  );
}
