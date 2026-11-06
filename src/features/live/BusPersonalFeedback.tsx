import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, Beer, X } from "lucide-react";
import { hEffect } from "../../../shared/bus";
import type { LiveBusView } from "../../../shared/live-bus";
import { sips } from "../../games/bus-copy";
import { useExitAnimation } from "../../ui/useExitAnimation";

interface Notice {
  id: string;
  drinkId: string;
  kind: "drink" | "given";
  sips: number;
  shots: number;
  person: string;
}

/** Feedback ends when its drink is confirmed, dismissed, or ten seconds old. */
export function BusPersonalFeedback({ view }: { view: LiveBusView }) {
  const [state, setState] = useState<{ seen: string[]; notices: Notice[] }>(
    () => ({
      seen: (view.deal.results ?? [])
        .filter((result) => !result.correct || result.recipient !== null)
        .map((result) => `deal:${result.player}:${result.question}`),
      notices: [],
    }),
  );
  const expire = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      notices: current.notices.filter((notice) => notice.id !== id),
    }));
  }, []);
  const events: Notice[] = [];
  const me = view.you;
  if (me >= 0) {
    for (const entry of view.plays) {
      const effect = hEffect(entry.hIndex ?? view.hIndex);
      const id = `h:${entry.player}:${entry.card.rank}:${entry.card.suit}`;
      if (entry.recipient === me) {
        events.push({
          id,
          drinkId: `h:${entry.card.rank}:${entry.card.suit}`,
          kind: "drink",
          sips: effect === "shot" ? 0 : 1,
          shots: effect === "shot" ? 1 : 0,
          person:
            effect === "give" ? view.players[entry.player].name : "deg selv",
        });
      } else if (entry.player === me && effect === "give") {
        events.push({
          id,
          drinkId: `h:${entry.card.rank}:${entry.card.suit}`,
          kind: "given",
          sips: 1,
          shots: 0,
          person: view.players[entry.recipient].name,
        });
      }
    }
    for (const result of view.deal.results ?? []) {
      const amount = result.question + 1;
      const id = `deal:${result.player}:${result.question}`;
      // Wrong guesses have inline feedback followed by a required drink dialog.
      if (result.correct && result.recipient === me) {
        events.push({
          id,
          drinkId: id,
          kind: "drink",
          sips: amount,
          shots: 0,
          person: view.players[result.player].name,
        });
      } else if (
        result.correct &&
        result.player === me &&
        result.recipient !== null
      ) {
        events.push({
          id,
          drinkId: id,
          kind: "given",
          sips: amount,
          shots: 0,
          person: view.players[result.recipient].name,
        });
      }
    }
  }
  const pending = new Set((view.pendingDrinks ?? []).map((drink) => drink.id));
  const notices = state.notices.filter((notice) => pending.has(notice.drinkId));
  const fresh = events.filter((event) => !state.seen.includes(event.id));
  if (fresh.length || notices.length !== state.notices.length) {
    setState({
      seen: [...state.seen, ...fresh.map((event) => event.id)],
      notices: [
        ...notices,
        ...fresh.filter((notice) => pending.has(notice.drinkId)),
      ],
    });
  }

  if (!state.notices.length) return null;
  return createPortal(
    <div className="bus-personal-feedback">
      {state.notices.map((notice) => (
        <TimedNotice key={notice.id} notice={notice} onExpire={expire} />
      ))}
    </div>,
    document.body,
  );
}

function TimedNotice({
  notice,
  onExpire,
}: {
  notice: Notice;
  onExpire: (id: string) => void;
}) {
  const ref = useRef<HTMLElement>(null);
  useExitAnimation(ref);
  useEffect(() => {
    const timer = setTimeout(() => onExpire(notice.id), 10000);
    return () => clearTimeout(timer);
  }, [notice.id, onExpire]);
  const Icon = notice.kind === "drink" ? Beer : ArrowUpRight;
  const amount = [
    notice.sips ? sips(notice.sips) : "",
    notice.shots
      ? `${notice.shots} ${notice.shots === 1 ? "shot" : "shots"}`
      : "",
  ]
    .filter(Boolean)
    .join(" og ");
  return (
    <aside
      ref={ref}
      className={`bus-personal-notice is-${notice.kind}`}
      role={notice.kind === "drink" ? "alert" : "status"}
      aria-atomic="true"
    >
      <button
        type="button"
        className="bus-notice-close"
        aria-label="Lukk varsel"
        onClick={() => onExpire(notice.id)}
      >
        <X size={18} />
      </button>
      <Icon size={28} aria-hidden="true" />
      <div>
        <h2>{notice.kind === "drink" ? "Du må drikke" : "Du delte ut"}</h2>
        <strong className="bus-personal-amount">{amount}</strong>
        <p>{`${notice.kind === "drink" ? "Fra" : "Til"} ${notice.person}.`}</p>
      </div>
      <span className="bus-notice-countdown" aria-hidden="true" />
    </aside>
  );
}
