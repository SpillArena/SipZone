import { useState } from "react";
import {
  TRUTHS_MAX_LENGTH,
  type LiveTruthsView,
} from "../../../shared/live-truths";
import type { RoomView } from "../../../shared/rooms";
import { Hint, HostButton, Message, TableFrame } from "./table-ui";
import { listNames, nameOf, type Send } from "./table-helpers";

/** To sannheter og en løgn: the writer writes, everyone else votes on their own phone. */
export function LiveTruths({
  room,
  view,
  disabled,
  send,
}: {
  room: RoomView;
  view: LiveTruthsView;
  disabled: boolean;
  send: Send;
}) {
  const host = room.you === room.host;
  const name = (id: string) => nameOf(view.players, id, room.you);
  const writing = view.writer === room.you;
  const [text, setText] = useState(["", "", ""]);
  const [lie, setLie] = useState<number | null>(null);
  const ready = text.every((line) => line.trim()) && lie !== null;
  const result = view.result;
  const statements = view.statements;

  return (
    <TableFrame eyebrow={`To sannheter og en løgn · runde ${view.round}`}>
      {view.phase === "write" &&
        (writing ? (
          <>
            <Message title="Din tur: skriv tre påstander om deg selv">
              To sanne og én løgn. Trykk på den som er løgnen.
            </Message>
            <form
              className="table-write"
              onSubmit={(event) => {
                event.preventDefault();
                if (!ready) return;
                send({
                  action: "table",
                  move: "write",
                  statements: text.map((line) => line.trim()),
                  lie,
                });
                setText(["", "", ""]);
                setLie(null);
              }}
            >
              {text.map((line, index) => (
                <div key={index} className="table-write-row">
                  <input
                    value={line}
                    maxLength={TRUTHS_MAX_LENGTH}
                    placeholder={`Påstand ${index + 1}`}
                    aria-label={`Påstand ${index + 1}`}
                    onChange={(event) =>
                      setText(
                        text.map((old, i) =>
                          i === index ? event.target.value : old,
                        ),
                      )
                    }
                  />
                  <button
                    type="button"
                    className="table-lie"
                    aria-pressed={lie === index}
                    onClick={() => setLie(index)}
                  >
                    {lie === index ? "Løgnen ✓" : "Er løgn"}
                  </button>
                </div>
              ))}
              <button
                type="submit"
                className="button primary full"
                disabled={disabled || !ready}
              >
                Send til gjengen
              </button>
            </form>
          </>
        ) : (
          <Message title={`${name(view.writer)} skriver`}>
            Vent mens {name(view.writer)} finner på tre påstander. Du skal
            gjette hvilken som er løgnen.
          </Message>
        ))}

      {view.phase !== "write" && statements && (
        <>
          <Message
            title={
              view.phase === "reveal"
                ? `Svaret fra ${name(view.writer)}`
                : writing
                  ? "Gjengen stemmer"
                  : `Hvilken av ${name(view.writer)} sine påstander er løgnen?`
            }
          >
            {view.phase === "vote" &&
              (writing
                ? `${view.voted} av ${view.needed} har stemt.`
                : view.myVote !== null
                  ? `Stemmen din er inne. ${view.voted} av ${view.needed} har stemt.`
                  : "Trykk på den du tror er løgnen.")}
          </Message>
          <ol className="table-statements">
            {statements.map((line, index) => {
              const votes = result
                ? Object.values(result.votes).filter((v) => v === index).length
                : 0;
              const isLie = result?.lie === index;
              return (
                <li key={index}>
                  <button
                    type="button"
                    className={`table-statement ${
                      result ? (isLie ? "is-lie" : "is-true") : ""
                    }`}
                    aria-pressed={view.myVote === index}
                    disabled={
                      disabled ||
                      view.phase !== "vote" ||
                      writing ||
                      view.myVote !== null
                    }
                    onClick={() =>
                      send({ action: "table", move: "vote", pick: index })
                    }
                  >
                    <b>{index + 1}</b>
                    <span>{line}</span>
                    {result && (
                      <em>
                        {isLie ? "Løgnen" : "Sant"} · {votes}{" "}
                        {votes === 1 ? "stemme" : "stemmer"}
                      </em>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
        </>
      )}

      {view.phase === "vote" && host && (
        <HostButton
          host
          secondary
          disabled={disabled || !view.voted}
          waiting=""
          onClick={() => send({ action: "table", move: "reveal" })}
        >
          Vis svaret nå
        </HostButton>
      )}

      {result && (
        <>
          <p className="bus-feedback bus-correct" role="status">
            {result.fooled.length === 0
              ? `Ingen lot seg lure! ${name(view.writer)} tar to slurker 🍺🍺`
              : result.right.length === 0
                ? `${name(view.writer)} lurte alle! ${listNames(result.fooled.map(name))} tar en slurk 🍺`
                : `${listNames(result.fooled.map(name))} gikk i fella og tar en slurk 🍺. ${listNames(result.right.map(name))} så gjennom det.`}
          </p>
          <HostButton
            host={host}
            disabled={disabled}
            waiting="Verten tar dere videre til neste spiller."
            onClick={() => send({ action: "table", move: "next" })}
          >
            Neste spiller →
          </HostButton>
        </>
      )}

      {view.phase === "write" && !writing && (
        <Hint>
          Alt skjer på mobilene deres. Ingen svar vises før alle har stemt.
        </Hint>
      )}
      {view.phase === "vote" && !host && writing && (
        <Hint>Du kan ikke stemme på din egen.</Hint>
      )}
    </TableFrame>
  );
}
