import { useState } from "react";
import type { LiveSpyView } from "../../../shared/live-spy";
import type { RoomView } from "../../../shared/rooms";
import { HandDrawer } from "../../games/BusRoute";
import {
  Hint,
  HostButton,
  Message,
  PlayerPicks,
  SecretCard,
  TableFrame,
} from "./table-ui";
import { listNames, nameOf, type Send } from "./table-helpers";

/** Hvem er spionen? Your role waits in the drawer; the table talks out loud. */
export function LiveSpy({
  room,
  view,
  disabled,
  send,
}: {
  room: RoomView;
  view: LiveSpyView;
  disabled: boolean;
  send: Send;
}) {
  const host = room.you === room.host;
  const name = (id: string) => nameOf(view.players, id, room.you);
  const move = (type: string, extra: Record<string, unknown> = {}) =>
    send({ action: "table", move: type, ...extra });
  const [guess, setGuess] = useState<string | null>(null);
  const playing = view.phase !== "done";
  const result = view.result;

  return (
    <TableFrame
      eyebrow={
        view.phase === "talk"
          ? "Hvem er spionen? · still spørsmål"
          : view.phase === "vote"
            ? "Hvem er spionen? · avstemming"
            : "Hvem er spionen? · oppgjør"
      }
    >
      {view.phase === "talk" && (
        <>
          <Message title="Still hverandre spørsmål om stedet">
            {view.isSpy
              ? "Du er spionen. Hør godt etter og bløff. Vet du hvor dere er, kan du gjette når som helst."
              : "Spør på skift og svar høyt. Vær nøyaktig nok til at spionen ikke gjetter stedet, men ikke så nøyaktig at spionen blir med."}
          </Message>
          <HostButton
            host={host}
            disabled={disabled}
            waiting="Verten åpner avstemmingen når dere har snakket nok."
            onClick={() => move("open-vote")}
          >
            Åpne avstemmingen
          </HostButton>
        </>
      )}

      {view.phase === "vote" && (
        <>
          <Message title="Hvem er spionen?">
            {view.hasVoted
              ? `Stemmen din er inne. ${view.voted} av ${view.players.length} har stemt.`
              : "Pek ut den du mistenker. Ingen ser hvem du velger."}
          </Message>
          {!view.hasVoted && (
            <PlayerPicks
              players={view.players.filter((player) => player.id !== room.you)}
              disabled={disabled}
              onPick={(target) => move("vote", { target })}
            />
          )}
          {host && (
            <HostButton
              host
              secondary
              disabled={disabled || !view.voted}
              waiting=""
              onClick={() => move("reveal")}
            >
              Vis resultatet nå
            </HostButton>
          )}
        </>
      )}

      {result && (
        <>
          <Message
            title={
              result.outcome === "caught"
                ? `${name(result.spy)} var spionen!`
                : result.outcome === "escaped"
                  ? `${name(result.spy)} slapp unna!`
                  : result.outcome === "guess-right"
                    ? `${name(result.spy)} gjettet stedet!`
                    : `${name(result.spy)} gjettet feil!`
            }
          >
            Stedet var <strong>{result.location}</strong>.{" "}
            {result.outcome === "caught"
              ? `Spionen ble avslørt og tar to slurker 🍺🍺`
              : result.outcome === "escaped"
                ? `Spionen lurte alle. ${listNames(
                    view.players
                      .filter((player) => player.id !== result.spy)
                      .map((player) => player.name),
                  )} tar en slurk 🍺`
                : result.outcome === "guess-right"
                  ? `Alle andre tar en slurk 🍺`
                  : `Spionen sa «${result.guess}» og tar to slurker 🍺🍺`}
          </Message>
          {Object.keys(result.counts).length > 0 && (
            <ul className="bus-remaining" aria-label="Stemmer">
              {view.players.map((player) => (
                <li key={player.id}>
                  <span>
                    {name(player.id)}
                    {player.id === result.spy ? " · spion" : ""}
                  </span>
                  <strong>{result.counts[player.id] ?? 0} stemmer</strong>
                </li>
              ))}
            </ul>
          )}
          <HostButton
            host={host}
            disabled={disabled}
            waiting="Verten starter en ny runde."
            onClick={() => move("again")}
          >
            Ny runde med ny spion →
          </HostButton>
        </>
      )}

      {playing && view.isSpy && (
        <section className="table-guess">
          <h3>Vet du hvor dere er?</h3>
          <p className="muted small">
            Riktig: du vinner. Feil: du taper med en gang.
          </p>
          <div className="table-chips">
            {view.locations.map((place) => (
              <button
                key={place}
                type="button"
                className="table-chip"
                aria-pressed={guess === place}
                onClick={() => setGuess(guess === place ? null : place)}
              >
                {place}
              </button>
            ))}
          </div>
          {guess && (
            <button
              type="button"
              className="button primary full"
              disabled={disabled}
              onClick={() => move("guess", { location: guess })}
            >
              Gjett «{guess}»
            </button>
          )}
        </section>
      )}
      {playing && !view.isSpy && (
        <details className="table-places">
          <summary>Alle mulige steder</summary>
          <div className="table-chips">
            {view.locations.map((place) => (
              <span key={place} className="table-chip is-static">
                {place}
              </span>
            ))}
          </div>
        </details>
      )}
      {playing && (
        <Hint>
          Bare du ser rollen din. Trykk på kortet nederst for å se den.
        </Hint>
      )}

      {playing && (
        <>
          <HandDrawer
            label="Trykk for å se rollen din"
            hideLabel="Skjul rollen"
          >
            {(open) => (
              <SecretCard open={open} tone={view.isSpy ? "danger" : "good"}>
                {view.isSpy ? (
                  <>
                    <small>Din rolle</small>
                    <strong>Du er spionen</strong>
                    <span>Finn ut hvor dere er. Ikke bli avslørt.</span>
                  </>
                ) : (
                  <>
                    <small>Stedet er</small>
                    <strong>{view.location}</strong>
                    <span>Finn spionen uten å si stedet rett ut.</span>
                  </>
                )}
              </SecretCard>
            )}
          </HandDrawer>
          <div className="bus-drawer-spacer" aria-hidden="true" />
        </>
      )}
    </TableFrame>
  );
}
