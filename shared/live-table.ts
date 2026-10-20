import { bluffMove, bluffView, startBluff } from "./live-bluff.ts";
import type { BluffState, LiveBluffView } from "./live-bluff.ts";
import { diceMove, diceView, startDice } from "./live-dice.ts";
import type { DiceState, LiveDiceView } from "./live-dice.ts";
import { spyMove, spyView, startSpy } from "./live-spy.ts";
import type { LiveSpyView, SpyState } from "./live-spy.ts";
import { startTruths, truthsMove, truthsView } from "./live-truths.ts";
import type { LiveTruthsView, TruthsState } from "./live-truths.ts";
import { startWolf, wolfMove, wolfView } from "./live-werewolf.ts";
import type { LiveWolfView, WolfState } from "./live-werewolf.ts";
import type { Member, Room } from "./rooms.ts";
import { RoomError } from "./rooms.ts";

/**
 * The Live games where every player holds something private: Hvem er spionen,
 * Varulv, Snyd, Løgnerdyst and To sannheter og en løgn. Each keeps its own
 * state in `room.table`; this file starts them, routes a player's move to the
 * right one and builds the view a single phone is allowed to see.
 */
export const TABLE_GAMES = [
  "spy",
  "werewolf",
  "bluff",
  "liars-dice",
  "two-truths",
] as const;
export type TableGame = (typeof TABLE_GAMES)[number];
export const isTableGame = (id: unknown): id is TableGame =>
  TABLE_GAMES.some((game) => game === id);

export type TableState =
  SpyState | WolfState | BluffState | DiceState | TruthsState;
export type LiveTableView =
  LiveSpyView | LiveWolfView | LiveBluffView | LiveDiceView | LiveTruthsView;

export function startTable(room: Room, random = Math.random): void {
  room.table =
    room.game === "spy"
      ? startSpy(room, random)
      : room.game === "werewolf"
        ? startWolf(room, random)
        : room.game === "bluff"
          ? startBluff(room, random)
          : room.game === "liars-dice"
            ? startDice(room, random)
            : room.game === "two-truths"
              ? startTruths(room)
              : null;
}

export function tableMove(
  room: Room,
  member: Member,
  input: Record<string, unknown>,
  random = Math.random,
): void {
  const state = room.table;
  if (room.phase !== "playing" || !state || state.game !== room.game)
    throw new RoomError("Spillet er ikke i gang.", 409);
  const host = member.id === room.host;
  const move = String(input.move);
  // the host paces the table, so those moves must come from the room as it is now
  const paced = ["open-vote", "reveal", "next", "again"].includes(move);
  if (paced && host && input.version !== room.version)
    throw new RoomError("Rommet har endret seg. Prøv igjen.", 409);
  if (state.game === "spy") spyMove(room, member, state, input, random);
  else if (state.game === "werewolf")
    wolfMove(room, member, state, input, random);
  else if (state.game === "bluff")
    bluffMove(room, member, state, input, random);
  else if (state.game === "liars-dice")
    diceMove(room, member, state, input, random);
  else truthsMove(room, member, state, input);
}

export function tableView(room: Room, memberId: string): LiveTableView | null {
  const state = room.table;
  if (!state || state.game !== room.game) return null;
  if (state.game === "spy") return spyView(state, memberId);
  if (state.game === "werewolf") return wolfView(state, memberId);
  if (state.game === "bluff") return bluffView(state, memberId);
  if (state.game === "liars-dice") return diceView(state, memberId);
  return truthsView(state, memberId);
}

/** A player leaving takes their secret with them; a hand cannot be dealt again mid-round. */
export function dropTablePlayer(room: Room, memberId: string): void {
  const state = room.table;
  if (!state || !state.players.some((player) => player.id === memberId)) return;
  room.table = null;
  if (isTableGame(room.game)) room.phase = "lobby";
}
