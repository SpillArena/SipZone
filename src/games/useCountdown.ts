import { useEffect, useState } from "react";
import { secondsLeft } from "../../shared/party-engine";
/** A wall-clock deadline keeps running while the document is hidden. */
export function useCountdown() {
  const [clock, setClock] = useState<{ deadline: number | null; now: number }>({
    deadline: null,
    now: 0,
  });
  const deadline = clock.deadline;
  useEffect(() => {
    if (deadline === null) return;
    const update = () =>
      setClock((current) => ({
        ...current,
        now: Math.max(current.now, Date.now()),
      }));
    const interval = setInterval(update, 100);
    document.addEventListener("visibilitychange", update);
    window.addEventListener("focus", update);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("focus", update);
    };
  }, [deadline]);
  return {
    deadline,
    remaining: deadline === null ? 0 : secondsLeft(deadline, clock.now),
    expired: deadline !== null && clock.now >= deadline,
    start: (seconds: number) => {
      const now = Date.now();
      setClock({ deadline: now + seconds * 1000, now });
    },
    reset: () => setClock({ deadline: null, now: 0 }),
    refresh: () =>
      setClock((current) => ({
        ...current,
        now: Math.max(current.now, Date.now()),
      })),
  };
}
