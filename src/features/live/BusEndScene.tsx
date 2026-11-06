import { useEffect, useRef, useState } from "react";
import { BusFront, RotateCcw } from "lucide-react";
import type { LiveBusView } from "../../../shared/live-bus";
import { BusFrame } from "../../games/BusRoute";
import { PlayerChip } from "./PlayerChip";

export function BusEndScene({
  view,
  disabled,
  send,
}: {
  view: LiveBusView;
  disabled: boolean;
  send: (input: Record<string, unknown>) => Promise<boolean>;
}) {
  const [error, setError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    heading.current?.closest(".bus-board")?.scrollIntoView({ block: "start" });
  }, []);
  const cleared = view.endReason === "cleared";
  const noDriver = view.endReason === "no-driver";
  const riders = view.drivers
    .map((index) => view.players[index]?.name)
    .join(" og ");
  return (
    <BusFrame active={3} counter="Bussruta · runden er ferdig">
      <section className="bus-end-scene" aria-labelledby="bus-end-title">
        <div
          className={`bus-end-art${cleared || noDriver ? " is-celebrating" : ""}`}
          aria-hidden="true"
        >
          <span>✦</span>
          <span>♦</span>
          <span>✦</span>
          <span>♣</span>
          <BusFront size={74} strokeWidth={1.5} />
        </div>
        <p className="eyebrow">Endestasjon</p>
        <h2 ref={heading} tabIndex={-1} id="bus-end-title">
          {noDriver
            ? "Alle slapp bussen!"
            : cleared
              ? "Helt til toppen!"
              : "Turen er over"}
        </h2>
        <p className="bus-end-lead">
          {noDriver
            ? "Hele gjengen tømte hånden. Det fortjener en ny runde."
            : cleared
              ? `${riders} kom gjennom hele pyramiden.`
              : "Bussruta er avsluttet. Klar for en ny tur med gjengen?"}
        </p>
        {!noDriver && (
          <dl className="bus-end-stats">
            <div>
              <dt>Forsøk</dt>
              <dd>{view.bus.attempt}</dd>
            </div>
            <div>
              <dt>Bildekort</dt>
              <dd>{view.bus.failures}</dd>
            </div>
            <div>
              <dt>Spillere</dt>
              <dd>{view.players.length}</dd>
            </div>
          </dl>
        )}
        <div className="bus-end-next">
          <h3>En runde til?</h3>
          <p>Åpne en ny lobby for hele gjengen.</p>
          <ul aria-label="Gjengen blir med videre">
            {view.players.map((player) => (
              <li key={player.id}>
                <PlayerChip name={player.name} size={44} />
              </li>
            ))}
          </ul>
          <button
            className="button primary"
            disabled={disabled}
            onClick={async () => {
              setError("");
              if (!(await send({ action: "lobby" })))
                setError("Kunne ikke åpne lobbyen. Prøv igjen.");
            }}
          >
            <RotateCcw size={19} aria-hidden="true" />{" "}
            {disabled ? "Åpner lobby …" : "Ny runde · til lobbyen"}
          </button>
          <p className="muted small">
            Alle følger med automatisk. Dere beholder romkoden.
          </p>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </div>
      </section>
    </BusFrame>
  );
}
