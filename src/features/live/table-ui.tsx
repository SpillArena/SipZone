import type { CSSProperties, ReactNode } from "react";
import { Actions } from "../../games/BusRoute";

import type { Seat } from "./table-helpers";

/** Shared pieces of the Live games where every phone holds something private. */

export function TableFrame({
  eyebrow,
  children,
}: {
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <div className="round-board table-board">
      {eyebrow && <p className="bus-counter">{eyebrow}</p>}
      <div className="bus-content">{children}</div>
    </div>
  );
}

export function Message({
  title,
  children,
}: {
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="bus-message">
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </div>
  );
}

/** Who to pick: one button per player. */
export function PlayerPicks({
  players,
  disabled,
  onPick,
  note,
}: {
  players: Seat[];
  disabled?: boolean;
  onPick: (id: string) => void;
  note?: (id: string) => ReactNode;
}) {
  return (
    <div className="bus-player-grid">
      {players.map((player) => (
        <button
          key={player.id}
          type="button"
          className="button secondary"
          disabled={disabled}
          onClick={() => onPick(player.id)}
        >
          {player.name}
          {note && <small>{note(player.id)}</small>}
        </button>
      ))}
    </div>
  );
}

/** A line of small print under a board: waiting for someone, or what happens next. */
export const Hint = ({ children }: { children: ReactNode }) => (
  <p className="action-hint" role="status">
    {children}
  </p>
);

/** The host's one button for the table. */
export function HostButton({
  host,
  disabled,
  waiting,
  onClick,
  children,
  secondary,
}: {
  host: boolean;
  disabled?: boolean;
  /** What everyone else reads while the host decides. */
  waiting: string;
  onClick: () => void;
  children: ReactNode;
  secondary?: boolean;
}) {
  return host ? (
    <Actions>
      <button
        type="button"
        className={`button ${secondary ? "secondary" : "primary"}`}
        disabled={disabled}
        onClick={onClick}
      >
        {children}
      </button>
    </Actions>
  ) : (
    <Hint>{waiting}</Hint>
  );
}

/** Who is still in the round, and a number beside each name. */
export function Roster({
  rows,
  label,
}: {
  rows: { id: string; name: string; value: ReactNode; out?: boolean }[];
  label: string;
}) {
  return (
    <ul className="bus-remaining" aria-label={label}>
      {rows.map((row) => (
        <li key={row.id} className={row.out ? "table-out" : undefined}>
          <span>{row.name}</span>
          <strong>{row.value}</strong>
        </li>
      ))}
    </ul>
  );
}

/**
 * A secret on a card that flips: closed it shows the back, open it shows what
 * only this player may see. Meant for the inside of a HandDrawer.
 */
export function SecretCard({
  open,
  tone = "plain",
  children,
}: {
  open: boolean;
  tone?: "plain" | "danger" | "good";
  children: ReactNode;
}) {
  return (
    <span
      className="bus-flip table-secret"
      style={{ "--i": 0 } as CSSProperties}
    >
      <span className={`bus-flip-inner ${open ? "" : "bus-flip-down"}`}>
        <span
          className={`bus-flip-face table-secret-face is-${tone}`}
          aria-hidden={!open}
        >
          {children}
        </span>
        <span
          className="bus-flip-face bus-flip-back table-secret-back"
          aria-hidden={open}
        >
          <b>S.</b>
        </span>
      </span>
    </span>
  );
}
