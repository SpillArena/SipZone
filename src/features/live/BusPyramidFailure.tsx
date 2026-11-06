import { useEffect, useState } from "react";
import type { LiveBusView } from "../../../shared/live-bus";
import { cardLabel } from "../../../shared/engine";
import { PlayingCard } from "../../games/GameControls";
import { PyramidCards } from "../../games/BusRoute";
import { PYRAMID_RESET_DELAY_MS } from "../../games/bus-copy";

/** Show the hit first, then preview the reset while acknowledgments are pending. */
export function BusPyramidFailure({ view }: { view: LiveBusView }) {
  const [reset, setReset] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setReset(true), PYRAMID_RESET_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);
  const { bus } = view;
  const hit = bus.pyramid[bus.picks.at(-1) ?? -1];
  return (
    <div className={`bus-pyramid-failure${reset ? " is-reset" : ""}`}>
      <div className="bus-pyramid-hit" role="status" aria-live="polite">
        {hit && <PlayingCard card={hit} />}
        <div>
          <p className="eyebrow">Bildekort på rad {bus.row}</p>
          <h2>{reset ? "Tilbake til start" : "Bildekort!"}</h2>
          <p>
            {hit && `${cardLabel(hit.rank)} ${hit.suit} · `}
            {reset
              ? "En ny pyramide gjøres klar."
              : "Denne sender bussen tilbake."}
          </p>
        </div>
      </div>
      <div
        key={reset ? "reset" : "reveal"}
        className={reset ? "bus-pyramid-reset" : ""}
      >
        <PyramidCards
          pyramid={reset ? bus.pyramid.map(() => null) : bus.pyramid}
          row={reset ? 1 : bus.row}
          active={false}
        />
      </div>
    </div>
  );
}
