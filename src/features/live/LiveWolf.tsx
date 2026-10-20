import type { LiveWolfView, WolfRole } from "../../../shared/live-werewolf";
import type { RoomView } from "../../../shared/rooms";
import { HandDrawer } from "../../games/BusRoute";
import {
  Hint,
  HostButton,
  Message,
  PlayerPicks,
  Roster,
  SecretCard,
  TableFrame,
} from "./table-ui";
import { listNames, nameOf, type Send } from "./table-helpers";

const roleName: Record<WolfRole, string> = {
  wolf: "Ulv",
  seer: "Seer",
  villager: "Landsbyboer",
};

/** Varulv: the phones are the moderator, the drawer holds your role. */
export function LiveWolf({
  room,
  view,
  disabled,
  send,
}: {
  room: RoomView;
  view: LiveWolfView;
  disabled: boolean;
  send: Send;
}) {
  const host = room.you === room.host;
  const name = (id: string) => nameOf(view.players, id, room.you);
  const move = (type: string, target: string) =>
    send({ action: "table", move: type, target });
  const alive = view.players.filter((player) => player.alive);
  const others = alive.filter((player) => player.id !== room.you);
  const prey = alive.filter((player) => !view.wolves.includes(player.id));
  const lynch = view.lastLynch;

  const recap = lynch && (
    <p className="table-recap">
      {lynch.id
        ? `${name(lynch.id)} ble stemt ut og var ${roleName[lynch.role!].toLowerCase()}. ${name(lynch.id)} tar en slurk 🍺`
        : "Stemmene stod likt. Ingen ble stemt ut."}
    </p>
  );

  return (
    <TableFrame
      eyebrow={
        view.phase === "done"
          ? "Varulv · slutt"
          : `Varulv · ${view.phase === "night" ? "natt" : "dag"} ${view.day}`
      }
    >
      {view.phase === "night" && (
        <>
          <Message title={`Natt ${view.day}. Landsbyen sover.`}>
            {!view.alive
              ? "Du er ute av spillet. Se på videre og hold munn."
              : view.role === "wolf" && view.canAct
                ? view.wolves.length > 1
                  ? `Dere er ${view.wolves.length} ulver. Velg offer. Er dere uenige, avgjør tilfeldighetene.`
                  : "Du er ulven. Velg et offer."
                : view.role === "seer" && view.canAct
                  ? "Velg en spiller. Du får vite om hen er ulv."
                  : view.acted
                    ? "Valget ditt er inne. Vent på resten."
                    : "Lukk øynene og vent til det blir dag."}
          </Message>
          {recap}
          {view.canAct && view.role === "wolf" && (
            <PlayerPicks
              players={prey}
              disabled={disabled}
              onPick={(id) => move("kill", id)}
            />
          )}
          {view.canAct && view.role === "seer" && (
            <PlayerPicks
              players={others}
              disabled={disabled}
              onPick={(id) => move("inspect", id)}
            />
          )}
        </>
      )}

      {view.phase === "day" && (
        <>
          <Message
            title={
              view.lastNight
                ? `${name(view.lastNight)} ble funnet død`
                : "Ingen døde i natt"
            }
          >
            {view.lastNight &&
              `${name(view.lastNight)} er ute og tar en slurk 🍺 `}
            {view.alive
              ? view.canAct
                ? "Snakk sammen, og stem ut den dere tror er ulven."
                : `Stemmen din er inne. ${view.dayVoted} av ${view.dayNeeded} har stemt.`
              : "Du er ute. Se på videre."}
          </Message>
          {view.canAct && (
            <PlayerPicks
              players={others}
              disabled={disabled}
              onPick={(id) => move("vote", id)}
            />
          )}
        </>
      )}

      {view.phase === "done" && (
        <>
          <Message
            title={
              view.winner === "village"
                ? "Landsbyen vant! 🏡"
                : "Ulvene vant! 🐺"
            }
          >
            {view.tally
              ? lynch?.id
                ? `${name(lynch.id)} ble stemt ut. `
                : ""
              : view.lastNight
                ? `${name(view.lastNight)} ble tatt i natt. `
                : ""}
            Ulvene var {listNames(view.wolves.map(name))}.{" "}
            {view.winner === "village"
              ? "Ulvene tar en slurk 🍺"
              : "Landsbyen tar en slurk 🍺"}
          </Message>
          <HostButton
            host={host}
            disabled={disabled}
            waiting="Verten starter en ny runde."
            onClick={() => send({ action: "table", move: "again" })}
          >
            Ny runde med nye roller →
          </HostButton>
        </>
      )}

      <Roster
        label="Spillerne"
        rows={view.players.map((player) => ({
          id: player.id,
          name: name(player.id),
          out: !player.alive,
          value:
            view.roles && view.roles[player.id]
              ? `${roleName[view.roles[player.id]]}${player.alive ? "" : " · ute"}`
              : player.alive
                ? "i live"
                : "ute",
        }))}
      />
      {view.phase !== "done" && (
        <Hint>
          Bare du ser rollen din. Trykk på kortet nederst for å se den.
        </Hint>
      )}

      <HandDrawer label="Trykk for å se rollen din" hideLabel="Skjul rollen">
        {(open) => (
          <SecretCard
            open={open}
            tone={view.role === "wolf" ? "danger" : "good"}
          >
            <small>{view.alive ? "Din rolle" : "Din rolle · du er ute"}</small>
            <strong>{roleName[view.role]}</strong>
            <span>
              {view.role === "wolf"
                ? view.wolves.length > 1
                  ? `Ulvene er ${listNames(view.wolves.map(name))}.`
                  : "Du er alene. Ta én hver natt og ikke bli avslørt."
                : view.role === "seer"
                  ? "Hver natt ser du om en spiller er ulv."
                  : "Finn ulvene før de tar over."}
            </span>
            {view.seen.length > 0 && (
              <ul className="table-seen">
                {view.seen.map((entry) => (
                  <li key={entry.id}>
                    {name(entry.id)}: {entry.wolf ? "ulv 🐺" : "ikke ulv"}
                  </li>
                ))}
              </ul>
            )}
          </SecretCard>
        )}
      </HandDrawer>
      <div className="bus-drawer-spacer" aria-hidden="true" />
    </TableFrame>
  );
}
