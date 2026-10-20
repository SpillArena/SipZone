import { cardDeck, cardLabel, type Card } from "./engine.ts";
import type { Member, Room } from "./rooms.ts";
import { RoomError } from "./rooms.ts";

/**
 * Snyd. Every player holds a private hand. On your turn you put one to four
 * cards face down and claim they are the rank in play; the next player either
 * believes it and plays on, or calls the bluff. Whoever is wrong takes the pile.
 * The first to empty their hand wins.
 */
export const BLUFF_MAX_PLAYERS = 6;
export interface BluffReveal {
  caller: string;
  accused: string;
  cards: Card[];
  rank: number;
  bluff: boolean;
  taker: string;
  pile: number;
}
export interface BluffState {
  game: "bluff";
  players: { id: string; name: string }[];
  hands: Record<string, Card[]>;
  turn: number;
  /** The rank the player up has to claim. */
  rank: number;
  pile: Card[];
  last: { player: string; count: number; cards: Card[]; rank: number } | null;
  reveal: BluffReveal | null;
  winner: string | null;
}
export interface LiveBluffView {
  kind: "bluff";
  players: { id: string; name: string; cards: number }[];
  hand: Card[];
  turn: string;
  rank: number;
  pile: number;
  last: { player: string; count: number; rank: number } | null;
  reveal: BluffReveal | null;
  winner: string | null;
}

export function startBluff(room: Room, random = Math.random): BluffState {
  const players = room.members.map(({ id, name }) => ({ id, name }));
  const deck = cardDeck(random);
  const hands: Record<string, Card[]> = {};
  players.forEach((player) => (hands[player.id] = []));
  deck.forEach((card, index) =>
    hands[players[index % players.length].id].push(card),
  );
  for (const id of Object.keys(hands))
    hands[id].sort((a, b) => a.rank - b.rank || a.suit.localeCompare(b.suit));
  return {
    game: "bluff",
    players,
    hands,
    turn: 0,
    rank: 1,
    pile: [],
    last: null,
    reveal: null,
    winner: null,
  };
}

const sameCard = (a: Card, b: Card) => a.rank === b.rank && a.suit === b.suit;
const nextRank = (rank: number) => (rank % 13) + 1;

export function bluffMove(
  room: Room,
  member: Member,
  state: BluffState,
  input: Record<string, unknown>,
  random = Math.random,
): void {
  const move = String(input.move);
  if (move === "again") {
    if (member.id !== room.host)
      throw new RoomError("Bare verten starter ny runde.", 403);
    if (!state.winner) throw new RoomError("Spillet er ikke ferdig.", 409);
    room.table = startBluff(room, random);
    return;
  }
  const hand = state.hands[member.id];
  if (!hand) throw new RoomError("Du er ikke med i denne runden.", 403);
  if (state.winner) throw new RoomError("Spillet er ferdig.", 409);
  const up = state.players[state.turn];
  if (up.id !== member.id) throw new RoomError("Det er ikke din tur.", 403);

  if (move === "play") {
    const wanted = Array.isArray(input.cards) ? input.cards : [];
    if (wanted.length < 1 || wanted.length > 4)
      throw new RoomError("Legg ett til fire kort.");
    const chosen: Card[] = [];
    for (const raw of wanted) {
      const candidate = raw as Partial<Card>;
      const card = hand.find(
        (own) =>
          own.rank === candidate.rank &&
          own.suit === candidate.suit &&
          !chosen.some((taken) => sameCard(taken, own)),
      );
      if (!card) throw new RoomError("Du har ikke de kortene.", 409);
      chosen.push(card);
    }
    // the last player had no cards left and nobody called: they win
    if (state.last && !state.hands[state.last.player].length) {
      state.winner = state.last.player;
      return;
    }
    state.hands[member.id] = hand.filter(
      (card) => !chosen.some((c) => sameCard(c, card)),
    );
    state.pile.push(...chosen);
    state.last = {
      player: member.id,
      count: chosen.length,
      cards: chosen,
      rank: state.rank,
    };
    state.reveal = null;
    state.rank = nextRank(state.rank);
    state.turn = (state.turn + 1) % state.players.length;
    return;
  }

  if (move === "call") {
    const last = state.last;
    if (!last) throw new RoomError("Det er ingenting å tvile på ennå.", 409);
    const bluff = last.cards.some((card) => card.rank !== last.rank);
    const taker = bluff ? last.player : member.id;
    state.reveal = {
      caller: member.id,
      accused: last.player,
      cards: last.cards,
      rank: last.rank,
      bluff,
      taker,
      pile: state.pile.length,
    };
    state.hands[taker] = [...state.hands[taker], ...state.pile].sort(
      (a, b) => a.rank - b.rank || a.suit.localeCompare(b.suit),
    );
    state.pile = [];
    state.last = null;
    if (!bluff && !state.hands[last.player].length) {
      state.winner = last.player;
      return;
    }
    state.turn = state.players.findIndex((player) => player.id === taker);
    return;
  }
  throw new RoomError("Ukjent trekk.");
}

export function bluffView(state: BluffState, memberId: string): LiveBluffView {
  return {
    kind: "bluff",
    players: state.players.map((player) => ({
      ...player,
      cards: state.hands[player.id]?.length ?? 0,
    })),
    hand: state.hands[memberId] ?? [],
    turn: state.players[state.turn].id,
    rank: state.rank,
    pile: state.pile.length,
    last: state.last
      ? {
          player: state.last.player,
          count: state.last.count,
          rank: state.last.rank,
        }
      : null,
    reveal: state.reveal,
    winner: state.winner,
  };
}

export const claimText = (count: number, rank: number) =>
  `${count} × ${cardLabel(rank)}`;
