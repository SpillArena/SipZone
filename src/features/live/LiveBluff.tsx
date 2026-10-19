import { useState } from "react";
import { cardLabel, type Card } from "../../../shared/engine";
import type { LiveBluffView } from "../../../shared/live-bluff";
import type { RoomView } from "../../../shared/rooms";
import { PlayingCard } from "../../games/GameControls";
import { Actions, HandDrawer } from "../../games/BusRoute";
import { Hint, HostButton, Message, Roster, TableFrame } from "./table-ui";
import { nameOf, type Send } from "./table-helpers";

const key = (card: Card) => `${card.rank}${card.suit}`;
const sips = (n: number) => `${n} ${n === 1 ? "slurk" : "slurker"}`;

/** Snyd: your hand in the drawer, the claim and the pile on the table. */
export function LiveBluff({
  room,
  view,
  disabled,
  send,
}: {
  room: RoomView;
  view: LiveBluffView;
  disabled: boolean;
  send: Send;
}) {
  const host = room.you === room.host;
  const name = (id: string) => nameOf(view.players, id, room.you);
  const mine = view.turn === room.you && !view.winner;
  const [picked, setPicked] = useState<string[]>([]);
  const [played, setPlayed] = useState(0);
  const chosen = view.hand.filter((card) => picked.includes(key(card)));
  const toggle = (card: Card) =>
    setPicked((current) =>
      current.includes(key(card))
        ? current.filter((id) => id !== key(card))
        : current.length < 4
          ? [...current, key(card)]
          : current,
    );
  const reveal = view.reveal;

  return (
    <TableFrame
      eyebrow={`Snyd · neste kort er ${cardLabel(view.rank)} · bunken har ${view.pile} kort`}
    >
      {view.winner ? (
        <>
          <Message title={`${name(view.winner)} vant!`}>
            Alle andre tar like mange slurker som de har kort igjen 🍺
          </Message>
          <HostButton
            host={host}
            disabled={disabled}
            waiting="Verten starter et nytt spill."
            onClick={() => send({ action: "table", move: "again" })}
          >
            Spill igjen →
          </HostButton>
        </>
      ) : (
        <Message title={mine ? "Din tur" : `${name(view.turn)} sin tur`}>
          {view.last
            ? `${name(view.last.player)} la ${view.last.count} × ${cardLabel(view.last.rank)}. ${
                mine
                  ? "Tror du på det? Ellers kall det løgn."
                  : "Venter på svar."
              }`
            : mine
              ? `Legg ett til fire kort og si at de er ${cardLabel(view.rank)}.`
              : "Venter på at første kort legges."}
        </Message>
      )}

      {reveal && (
        <section className="table-reveal" role="status">
          <p>
            <strong>{name(reveal.caller)}</strong> kalte{" "}
            <strong>{name(reveal.accused)}</strong> for løgner. Kortene var:
          </p>
          <div className="bus-hand table-reveal-cards">
            {reveal.cards.map((card, index) => (
              <div key={index}>
                <PlayingCard card={card} />
              </div>
            ))}
          </div>
          <p className={reveal.bluff ? "bus-wrong" : "bus-correct"}>
            {reveal.bluff
              ? `Snyd! ${name(reveal.taker)} tar bunken (${reveal.pile} kort) og ${sips(1)} 🍺`
              : `Ærlig! ${name(reveal.taker)} tok feil, tar bunken (${reveal.pile} kort) og ${sips(1)} 🍺`}
          </p>
        </section>
      )}

      {mine && view.last && (
        <Actions>
          <button
            type="button"
            className="button primary"
            disabled={disabled}
            onClick={() => send({ action: "table", move: "call" })}
          >
            Kall løgn! ✋
          </button>
        </Actions>
      )}
      {mine && (
        <Hint>
          {view.last
            ? `Eller legg ${cardLabel(view.rank)} fra hånden din: åpne kortene nederst.`
            : "Åpne kortene nederst, velg og legg dem."}
        </Hint>
      )}
      {!mine && !view.winner && view.hand.length > 0 && (
        <Hint>
          Kortene dine ligger nederst på skjermen. Trykk for å se dem.
        </Hint>
      )}

      <Roster
        label="Kort igjen"
        rows={view.players.map((player) => ({
          id: player.id,
          name: name(player.id),
          value: `${player.cards} kort`,
          out: false,
        }))}
      />

      <HandDrawer
        closeOn={played}
        label={`Trykk for å se kortene dine · ${view.hand.length} kort`}
      >
        {(open) => (
          <>
            <div className="bluff-hand">
              {view.hand.map((card) => (
                <button
                  key={key(card)}
                  type="button"
                  className="bluff-card"
                  aria-pressed={picked.includes(key(card))}
                  aria-label={`${cardLabel(card.rank)} ${card.suit}`}
                  disabled={!open || !mine}
                  onClick={() => toggle(card)}
                >
                  <PlayingCard card={card} back={!open} />
                </button>
              ))}
            </div>
            {mine ? (
              <button
                type="button"
                className="button primary full bluff-play"
                disabled={disabled || chosen.length === 0}
                onClick={() => {
                  send({
                    action: "table",
                    move: "play",
                    cards: chosen.map(({ rank, suit }) => ({ rank, suit })),
                  });
                  setPicked([]);
                  setPlayed((n) => n + 1);
                }}
              >
                {chosen.length
                  ? `Legg ${chosen.length} ${chosen.length === 1 ? "kort" : "kort"} som ${cardLabel(view.rank)}`
                  : `Velg 1–4 kort å legge som ${cardLabel(view.rank)}`}
              </button>
            ) : (
              <p className="bus-drawer-empty">
                {view.winner ? "Spillet er ferdig." : "Vent på din tur."}
              </p>
            )}
          </>
        )}
      </HandDrawer>
      <div className="bus-drawer-spacer" aria-hidden="true" />
    </TableFrame>
  );
}
