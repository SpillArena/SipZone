import type { Member, Room } from "./rooms.ts";
import { RoomError } from "./rooms.ts";

/**
 * To sannheter og en løgn. The player up writes three statements about
 * themselves on their own phone, two true and one made up, and marks the lie.
 * Everyone else votes in secret on which one is the lie.
 */
export const TRUTHS_MAX_LENGTH = 120;
export interface TruthsState {
  game: "two-truths";
  players: { id: string; name: string }[];
  round: number;
  phase: "write" | "vote" | "reveal";
  statements: string[] | null;
  lie: number | null;
  votes: Record<string, number>;
}
export interface LiveTruthsView {
  kind: "two-truths";
  phase: TruthsState["phase"];
  round: number;
  players: { id: string; name: string }[];
  writer: string;
  statements: string[] | null;
  voted: number;
  needed: number;
  myVote: number | null;
  result: null | {
    lie: number;
    votes: Record<string, number>;
    fooled: string[];
    right: string[];
  };
}

export function startTruths(room: Room): TruthsState {
  return {
    game: "two-truths",
    players: room.members.map(({ id, name }) => ({ id, name })),
    round: 1,
    phase: "write",
    statements: null,
    lie: null,
    votes: {},
  };
}
const writerOf = (state: TruthsState) =>
  state.players[(state.round - 1) % state.players.length];

export function truthsMove(
  room: Room,
  member: Member,
  state: TruthsState,
  input: Record<string, unknown>,
): void {
  const move = String(input.move);
  const seated = state.players.some((player) => player.id === member.id);
  if (!seated) throw new RoomError("Du er ikke med i denne runden.", 403);
  const writer = writerOf(state);
  const host = member.id === room.host;
  if (move === "write") {
    if (writer.id !== member.id)
      throw new RoomError("Det er ikke din tur å skrive.", 403);
    if (state.phase !== "write")
      throw new RoomError("Du har allerede skrevet.", 409);
    const raw = Array.isArray(input.statements) ? input.statements : [];
    const statements = raw
      .map((text) => (typeof text === "string" ? text.trim() : ""))
      .filter(Boolean);
    const lie = Number(input.lie);
    if (
      raw.length !== 3 ||
      statements.length !== 3 ||
      statements.some((text) => text.length > TRUTHS_MAX_LENGTH) ||
      !Number.isInteger(lie) ||
      lie < 0 ||
      lie > 2
    )
      throw new RoomError("Skriv tre påstander og marker løgnen.");
    state.statements = statements;
    state.lie = lie;
    state.votes = {};
    state.phase = "vote";
  } else if (move === "vote") {
    if (state.phase !== "vote")
      throw new RoomError("Avstemmingen er ikke åpen.", 409);
    if (writer.id === member.id)
      throw new RoomError("Du kan ikke stemme på din egen.", 403);
    if (state.votes[member.id] !== undefined)
      throw new RoomError("Du har allerede stemt.", 409);
    const pick = Number(input.pick);
    if (!Number.isInteger(pick) || pick < 0 || pick > 2)
      throw new RoomError("Velg en påstand.");
    state.votes[member.id] = pick;
    if (Object.keys(state.votes).length >= state.players.length - 1)
      state.phase = "reveal";
  } else if (move === "reveal") {
    if (!host) throw new RoomError("Bare verten viser svaret.", 403);
    if (state.phase !== "vote" || !Object.keys(state.votes).length)
      throw new RoomError("Vent på minst én stemme.", 409);
    state.phase = "reveal";
  } else if (move === "next") {
    if (!host) throw new RoomError("Bare verten går videre.", 403);
    if (state.phase !== "reveal")
      throw new RoomError("Runden er ikke ferdig.", 409);
    state.round++;
    state.phase = "write";
    state.statements = null;
    state.lie = null;
    state.votes = {};
  } else throw new RoomError("Ukjent trekk.");
}

export function truthsView(
  state: TruthsState,
  memberId: string,
): LiveTruthsView {
  const writer = writerOf(state);
  const reveal = state.phase === "reveal" && state.lie !== null;
  const ids = Object.keys(state.votes);
  return {
    kind: "two-truths",
    phase: state.phase,
    round: state.round,
    players: state.players,
    writer: writer.id,
    // the writer's own phone shows the lie while they write; nobody else gets it early
    statements: state.statements,
    voted: ids.length,
    needed: state.players.length - 1,
    myVote: state.votes[memberId] ?? null,
    result: reveal
      ? {
          lie: state.lie!,
          votes: state.votes,
          fooled: ids.filter((id) => state.votes[id] !== state.lie),
          right: ids.filter((id) => state.votes[id] === state.lie),
        }
      : null,
  };
}
