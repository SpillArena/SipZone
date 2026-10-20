import { shuffle } from "./engine.ts";
import type { Member, Room } from "./rooms.ts";
import { RoomError } from "./rooms.ts";

/**
 * Varulv. Hidden roles on every phone, so the night happens in secret and the
 * day is decided by vote. The phones act as the moderator: they collect the
 * wolves' choice and the seer's look, announce who is gone and count the
 * lynching. Wolves, one seer, the rest villagers.
 */
export type WolfRole = "wolf" | "seer" | "villager";
export interface WolfState {
  game: "werewolf";
  players: { id: string; name: string }[];
  roles: Record<string, WolfRole>;
  alive: string[];
  phase: "night" | "day" | "done";
  day: number;
  wolfVotes: Record<string, string>;
  seerPick: string | null;
  /** What the seer has learned: player id → is a wolf. */
  seen: Record<string, boolean>;
  lastNight: string | null;
  lastLynch: { id: string | null; role: WolfRole | null } | null;
  dayVotes: Record<string, string>;
  tally: Record<string, number> | null;
  winner: "village" | "wolves" | null;
}
export interface LiveWolfView {
  kind: "werewolf";
  phase: WolfState["phase"];
  day: number;
  players: { id: string; name: string; alive: boolean }[];
  role: WolfRole;
  alive: boolean;
  /** Fellow wolves, for a wolf. Everyone at the end. */
  wolves: string[];
  /** Whether it is your turn to act right now, and whether you already did. */
  canAct: boolean;
  acted: boolean;
  seen: { id: string; wolf: boolean }[];
  lastNight: string | null;
  lastLynch: WolfState["lastLynch"];
  dayVoted: number;
  dayNeeded: number;
  tally: Record<string, number> | null;
  winner: WolfState["winner"];
  roles: Record<string, WolfRole> | null;
}

export const wolfCount = (players: number) =>
  players >= 9 ? 3 : players >= 6 ? 2 : 1;

export function startWolf(room: Room, random = Math.random): WolfState {
  const players = room.members.map(({ id, name }) => ({ id, name }));
  const order = shuffle(players, random);
  const roles: Record<string, WolfRole> = {};
  order.forEach((player, index) => {
    const wolves = wolfCount(players.length);
    roles[player.id] =
      index < wolves
        ? "wolf"
        : index === wolves && players.length >= 5
          ? "seer"
          : "villager";
  });
  return {
    game: "werewolf",
    players,
    roles,
    alive: players.map((player) => player.id),
    phase: "night",
    day: 1,
    wolfVotes: {},
    seerPick: null,
    seen: {},
    lastNight: null,
    lastLynch: null,
    dayVotes: {},
    tally: null,
    winner: null,
  };
}

const aliveWith = (state: WolfState, role: WolfRole) =>
  state.alive.filter((id) => state.roles[id] === role);
function checkWinner(state: WolfState) {
  const wolves = aliveWith(state, "wolf").length;
  const others = state.alive.length - wolves;
  state.winner = wolves === 0 ? "village" : wolves >= others ? "wolves" : null;
  if (state.winner) state.phase = "done";
}
function pick(
  tally: Record<string, number>,
  random: () => number,
): string | null {
  const top = Math.max(0, ...Object.values(tally));
  const leaders = Object.keys(tally).filter((id) => tally[id] === top);
  return leaders.length ? leaders[Math.floor(random() * leaders.length)] : null;
}
function tallyOf(votes: Record<string, string>) {
  const tally: Record<string, number> = {};
  for (const target of Object.values(votes))
    tally[target] = (tally[target] ?? 0) + 1;
  return tally;
}
function maybeResolveNight(state: WolfState, random: () => number) {
  const wolves = aliveWith(state, "wolf");
  const seer = aliveWith(state, "seer");
  if (!wolves.every((id) => state.wolfVotes[id])) return;
  if (seer.length && !state.seerPick) return;
  const victim = pick(tallyOf(state.wolfVotes), random);
  state.lastNight = victim;
  state.alive = state.alive.filter((id) => id !== victim);
  state.dayVotes = {};
  state.tally = null;
  state.phase = "day";
  checkWinner(state);
}
function maybeResolveDay(state: WolfState) {
  if (!state.alive.every((id) => state.dayVotes[id])) return;
  const tally = tallyOf(state.dayVotes);
  const top = Math.max(0, ...Object.values(tally));
  const leaders = Object.keys(tally).filter((id) => tally[id] === top);
  const lynched = leaders.length === 1 ? leaders[0] : null;
  state.tally = tally;
  state.lastLynch = {
    id: lynched,
    role: lynched ? state.roles[lynched] : null,
  };
  if (lynched) state.alive = state.alive.filter((id) => id !== lynched);
  checkWinner(state);
  if (state.winner) return;
  state.phase = "night";
  state.day++;
  state.wolfVotes = {};
  state.seerPick = null;
}

export function wolfMove(
  room: Room,
  member: Member,
  state: WolfState,
  input: Record<string, unknown>,
  random = Math.random,
): void {
  const move = String(input.move);
  if (move === "again") {
    if (member.id !== room.host)
      throw new RoomError("Bare verten starter ny runde.", 403);
    if (state.phase !== "done")
      throw new RoomError("Runden er ikke ferdig.", 409);
    room.table = startWolf(room, random);
    return;
  }
  const role = state.roles[member.id];
  if (!role) throw new RoomError("Du er ikke med i denne runden.", 403);
  const living = state.alive.includes(member.id);
  const target = input.target;
  const valid = (id: unknown): id is string =>
    typeof id === "string" && state.alive.includes(id);
  if (move === "kill") {
    if (state.phase !== "night" || role !== "wolf" || !living)
      throw new RoomError("Du kan ikke velge offer nå.", 403);
    if (state.wolfVotes[member.id])
      throw new RoomError("Du har allerede valgt.", 409);
    if (!valid(target) || state.roles[target] === "wolf")
      throw new RoomError("Velg en som ikke er ulv.");
    state.wolfVotes[member.id] = target;
    maybeResolveNight(state, random);
  } else if (move === "inspect") {
    if (state.phase !== "night" || role !== "seer" || !living)
      throw new RoomError("Du kan ikke se på noen nå.", 403);
    if (state.seerPick)
      throw new RoomError("Du har allerede sett på noen i natt.", 409);
    if (!valid(target) || target === member.id)
      throw new RoomError("Velg en annen spiller.");
    state.seerPick = target;
    state.seen[target] = state.roles[target] === "wolf";
    maybeResolveNight(state, random);
  } else if (move === "vote") {
    if (state.phase !== "day" || !living)
      throw new RoomError("Du kan ikke stemme nå.", 403);
    if (state.dayVotes[member.id])
      throw new RoomError("Du har allerede stemt.", 409);
    if (!valid(target) || target === member.id)
      throw new RoomError("Velg en annen spiller.");
    state.dayVotes[member.id] = target;
    maybeResolveDay(state);
  } else throw new RoomError("Ukjent trekk.");
}

export function wolfView(state: WolfState, memberId: string): LiveWolfView {
  const role = state.roles[memberId] ?? "villager";
  const living = state.alive.includes(memberId);
  const done = state.phase === "done";
  const canAct =
    living &&
    ((state.phase === "night" &&
      role === "wolf" &&
      !state.wolfVotes[memberId]) ||
      (state.phase === "night" && role === "seer" && !state.seerPick) ||
      (state.phase === "day" && !state.dayVotes[memberId]));
  return {
    kind: "werewolf",
    phase: state.phase,
    day: state.day,
    players: state.players.map((player) => ({
      ...player,
      alive: state.alive.includes(player.id),
    })),
    role,
    alive: living,
    wolves:
      role === "wolf" || done
        ? state.players
            .filter((p) => state.roles[p.id] === "wolf")
            .map((p) => p.id)
        : [],
    canAct,
    acted:
      living &&
      !canAct &&
      (state.phase === "day"
        ? Boolean(state.dayVotes[memberId])
        : role === "wolf"
          ? Boolean(state.wolfVotes[memberId])
          : role === "seer"
            ? Boolean(state.seerPick)
            : false),
    seen:
      role === "seer"
        ? Object.entries(state.seen).map(([id, wolf]) => ({ id, wolf }))
        : [],
    lastNight: state.lastNight,
    lastLynch: state.lastLynch,
    dayVoted: Object.keys(state.dayVotes).length,
    dayNeeded: state.alive.length,
    tally: state.tally,
    winner: state.winner,
    roles: done ? state.roles : null,
  };
}
