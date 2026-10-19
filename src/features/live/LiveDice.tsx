import { useState } from "react";
import type { LiveDiceView } from "../../../shared/live-dice";
import type { RoomView } from "../../../shared/rooms";
import { Actions, HandDrawer } from "../../games/BusRoute";
import {
  Hint,
  HostButton,
  Message,
  Roster,
  SecretCard,
  TableFrame,
} from "./table-ui";
import { nameOf, type Send } from "./table-helpers";

/** The pips of one die, on a three-by-three grid. */
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};
export function Die({
  value,
  size = "md",
  hot,
}: {
  value: number;
  size?: "sm" | "md";
  /** A die that counts toward the bid when the dice are shown. */
  hot?: boolean;
}) {
  return (
    <span
      className={`die die-${size} ${hot ? "is-hot" : ""}`}
      role="img"
      aria-label={`Terning: ${value}`}
    >
      {Array.from({ length: 9 }, (_, index) => (
        <i key={index} className={PIPS[value]?.includes(index) ? "on" : ""} />
      ))}
    </span>
  );
}

const diceText = (n: number) => `${n} ${n === 1 ? "terning" : "terninger"}`;

/** Løgnerdyst: your dice in the drawer, the bid and the cup count on the table. */
export function LiveDice({
  room,
  view,
  disabled,
  send,
}: {
  room: RoomView;
  view: LiveDiceView;
  disabled: boolean;
  send: Send;
}) {
  const host = room.you === room.host;
  const name = (id: string) => nameOf(view.players, id, room.you);
  const me = view.players.find((player) => player.id === room.you);
  const out = !me || me.dice === 0;
  const mine = view.turn === room.you && view.phase === "bid" && !out;
  const bid = view.bid;
  const reveal = view.reveal;
  const start = bid
    ? bid.face < 6
      ? { qty: bid.qty, face: bid.face + 1 }
      : { qty: bid.qty + 1, face: 2 }
    : { qty: 1, face: 2 };
  const [qty, setQty] = useState(start.qty);
  const [face, setFace] = useState(start.face);
  // a new bid on the table resets the spinner to the lowest legal raise
  const stamp = `${bid?.qty}-${bid?.face}-${view.round}`;
  const [seen, setSeen] = useState(stamp);
  if (seen !== stamp) {
    setSeen(stamp);
    setQty(start.qty);
    setFace(start.face);
  }
  const legal = !bid || qty > bid.qty || (qty === bid.qty && face > bid.face);

  return (
    <TableFrame
      eyebrow={`Løgnerdyst · runde ${view.round} · ${diceText(view.total)} på bordet`}
    >
      {view.phase === "bid" && (
        <>
          <Message
            title={
              out
                ? "Du er ute"
                : mine
                  ? "Din tur å by"
                  : `${name(view.turn)} sin tur`
            }
          >
            {bid
              ? `${name(bid.player)} byr ${bid.qty} × ${bid.face}. Enere teller som alle verdier.`
              : mine
                ? "Du åpner. Hvor mange terninger av én verdi er det på bordet? Enere teller som alle verdier."
                : "Første bud kommer snart."}
          </Message>
          {bid && (
            <div className="table-bid" aria-label="Siste bud">
              <strong>{bid.qty} ×</strong>
              <Die value={bid.face} />
            </div>
          )}
        </>
      )}

      {mine && (
        <section className="table-bidder">
          <div className="table-stepper">
            <button
              type="button"
              className="button secondary"
              aria-label="Færre"
              disabled={qty <= 1}
              onClick={() => setQty(qty - 1)}
            >
              −
            </button>
            <output aria-live="polite">{qty} ×</output>
            <button
              type="button"
              className="button secondary"
              aria-label="Flere"
              disabled={qty >= view.total}
              onClick={() => setQty(qty + 1)}
            >
              +
            </button>
          </div>
          <div className="table-faces" role="group" aria-label="Øyne">
            {[2, 3, 4, 5, 6].map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={face === value}
                aria-label={`${value} øyne`}
                onClick={() => setFace(value)}
              >
                <Die value={value} size="sm" />
              </button>
            ))}
          </div>
          <Actions>
            <button
              type="button"
              className="button primary"
              disabled={disabled || !legal}
              onClick={() => send({ action: "table", move: "bid", qty, face })}
            >
              {legal ? `Byd ${qty} × ${face}` : "Du må øke budet"}
            </button>
            {bid && (
              <button
                type="button"
                className="button secondary"
                disabled={disabled}
                onClick={() => send({ action: "table", move: "call" })}
              >
                Løgner! ✋
              </button>
            )}
          </Actions>
        </section>
      )}

      {view.phase === "reveal" && reveal && (
        <>
          <Message
            title={
              view.winner
                ? `${name(view.winner)} vant!`
                : `${name(reveal.loser)} mister en terning`
            }
          >
            {name(reveal.caller)} kalte budet til {name(reveal.bidder)}:{" "}
            {reveal.bid.qty} × {reveal.bid.face}. Det var {reveal.count}.{" "}
            {name(reveal.loser)} tar en slurk 🍺
            {view.winner && " Alle andre er ute."}
          </Message>
          <ul className="table-cups" aria-label="Terningene på bordet">
            {view.players.map((player) => (
              <li key={player.id}>
                <span>{name(player.id)}</span>
                <span className="table-dice-row">
                  {(reveal.dice[player.id] ?? []).map((value, index) => (
                    <Die
                      key={index}
                      value={value}
                      size="sm"
                      hot={value === reveal.bid.face || value === 1}
                    />
                  ))}
                </span>
              </li>
            ))}
          </ul>
          {view.winner ? (
            <HostButton
              host={host}
              disabled={disabled}
              waiting="Verten starter et nytt spill."
              onClick={() => send({ action: "table", move: "again" })}
            >
              Spill igjen →
            </HostButton>
          ) : out ? (
            <Hint>Du er ute. Se på videre.</Hint>
          ) : (
            <Actions>
              <button
                type="button"
                className="button primary"
                disabled={disabled}
                onClick={() => send({ action: "table", move: "next" })}
              >
                Neste runde →
              </button>
            </Actions>
          )}
        </>
      )}

      {view.phase === "bid" && !mine && !out && (
        <Hint>
          Terningene dine ligger nederst på skjermen. Trykk for å se dem.
        </Hint>
      )}

      <Roster
        label="Terninger igjen"
        rows={view.players.map((player) => ({
          id: player.id,
          name: name(player.id),
          out: player.dice === 0,
          value: player.dice ? diceText(player.dice) : "ute",
        }))}
      />

      {!out && view.phase === "bid" && (
        <>
          <HandDrawer
            label={`Trykk for å se terningene dine · ${view.mine.length}`}
            hideLabel="Skjul terningene"
          >
            {(open) => (
              <SecretCard open={open}>
                <small>Dine terninger</small>
                <span className="table-dice-row">
                  {view.mine.map((value, index) => (
                    <Die key={index} value={value} />
                  ))}
                </span>
                <span>{diceText(view.mine.length)} · enere er jokere.</span>
              </SecretCard>
            )}
          </HandDrawer>
          <div className="bus-drawer-spacer" aria-hidden="true" />
        </>
      )}
    </TableFrame>
  );
}
