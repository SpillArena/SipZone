import type { Member, Room } from "./rooms.ts";
import { RoomError } from "./rooms.ts";

/**
 * Løgnerdyst. Everyone shakes five dice under a cup and looks at their own.
 * Bid how many dice of one face the whole table holds, raising the bid or
 * calling the last bidder a liar. Ones are wild. Whoever is wrong loses a die
 * and drinks; the last player with dice left wins.
 */
export const DICE_START = 5;
export const DICE_MAX_PLAYERS = 8;
export interface DiceBid {
  player: string;
  qty: number;
  face: number;
}
export interface DiceReveal {
  caller: string;
  bidder: string;
  bid: DiceBid;
  count: number;
  dice: Record<string, number[]>;
  loser: string;
}
export interface DiceState {
  game: "liars-dice";
  players: { id: string; name: string }[];
  dice: Record<string, number[]>;
  left: Record<string, number>;
  phase: "bid" | "reveal";
  turn: number;
  bid: DiceBid | null;
  reveal: DiceReveal | null;
  winner: string | null;
  round: number;
}
export interface LiveDiceView {
  kind: "liars-dice";
  phase: DiceState["phase"];
  players: { id: string; name: string; dice: number }[];
  mine: number[];
  turn: string;
  bid: DiceBid | null;
  total: number;
  reveal: DiceReveal | null;
  winner: string | null;
  round: number;
}

function roll(state: DiceState, random: () => number) {
  state.dice = {};
  for (const player of state.players)
    state.dice[player.id] = Array.from(
      { length: state.left[player.id] },
      () => 1 + Math.floor(random() * 6),
    );
}
export function startDice(room: Room, random = Math.random): DiceState {
  const players = room.members.map(({ id, name }) => ({ id, name }));
  const state: DiceState = {
    game: "liars-dice",
    players,
    dice: {},
    left: Object.fromEntries(players.map((player) => [player.id, DICE_START])),
    phase: "bid",
    turn: 0,
    bid: null,
    reveal: null,
    winner: null,
    round: 1,
  };
  roll(state, random);
  return state;
}
const total = (state: DiceState) =>
  Object.values(state.left).reduce((sum, n) => sum + n, 0);
/** Ones count for any face. */
export const diceCount = (dice: Record<string, number[]>, face: number) =>
  Object.values(dice)
    .flat()
    .filter((value) => value === face || value === 1).length;
function nextAlive(state: DiceState, from: number) {
  for (let step = 1; step <= state.players.length; step++) {
    const index = (from + step) % state.players.length;
    if (state.left[state.players[index].id] > 0) return index;
  }
  return from;
}

export function diceMove(
  room: Room,
  member: Member,
  state: DiceState,
  input: Record<string, unknown>,
  random = Math.random,
): void {
  const move = String(input.move);
  if (move === "again") {
    if (member.id !== room.host)
      throw new RoomError("Bare verten starter nytt spill.", 403);
    if (!state.winner) throw new RoomError("Spillet er ikke ferdig.", 409);
    room.table = startDice(room, random);
    return;
  }
  if (!(member.id in state.left))
    throw new RoomError("Du er ikke med i denne runden.", 403);
  if (move === "next") {
    if (state.phase !== "reveal" || state.winner)
      throw new RoomError("Ingen ny runde å starte.", 409);
    const loser = state.reveal!.loser;
    const index = state.players.findIndex((player) => player.id === loser);
    state.turn = state.left[loser] > 0 ? index : nextAlive(state, index);
    state.bid = null;
    state.reveal = null;
    state.phase = "bid";
    state.round++;
    roll(state, random);
    return;
  }
  if (state.phase !== "bid") throw new RoomError("Runden er ferdig.", 409);
  if (state.players[state.turn].id !== member.id)
    throw new RoomError("Det er ikke din tur.", 403);

  if (move === "bid") {
    const qty = Number(input.qty);
    const face = Number(input.face);
    if (
      !Number.isInteger(qty) ||
      !Number.isInteger(face) ||
      face < 2 ||
      face > 6 ||
      qty < 1
    )
      throw new RoomError("Ugyldig bud.");
    if (qty > total(state))
      throw new RoomError("Det er ikke så mange terninger igjen.");
    const prev = state.bid;
    if (prev && !(qty > prev.qty || (qty === prev.qty && face > prev.face)))
      throw new RoomError(
        "Du må øke budet: flere terninger, eller samme antall med høyere øyne.",
      );
    state.bid = { player: member.id, qty, face };
    state.turn = nextAlive(state, state.turn);
    return;
  }
  if (move === "call") {
    const bid = state.bid;
    if (!bid) throw new RoomError("Det er ingenting å tvile på ennå.", 409);
    const count = diceCount(state.dice, bid.face);
    const loser = count >= bid.qty ? member.id : bid.player;
    state.left[loser]--;
    state.reveal = {
      caller: member.id,
      bidder: bid.player,
      bid,
      count,
      dice: state.dice,
      loser,
    };
    state.phase = "reveal";
    const alive = state.players.filter((player) => state.left[player.id] > 0);
    if (alive.length === 1) state.winner = alive[0].id;
    return;
  }
  throw new RoomError("Ukjent trekk.");
}

export function diceView(state: DiceState, memberId: string): LiveDiceView {
  return {
    kind: "liars-dice",
    phase: state.phase,
    players: state.players.map((player) => ({
      ...player,
      dice: state.left[player.id],
    })),
    mine: state.dice[memberId] ?? [],
    turn: state.players[state.turn].id,
    bid: state.bid,
    total: total(state),
    reveal: state.reveal,
    winner: state.winner,
    round: state.round,
  };
}
