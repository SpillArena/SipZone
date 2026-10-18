import { voteResults } from "./engine.ts";
import type { Card, Player } from "./engine.ts";
import type { Category } from "./catalog.ts";
import type { Prompt } from "./content.ts";
import {
  advanceRound,
  dropPlayer,
  isLiveGame,
  liveGame,
  liveView,
  passPotato,
  revealRound,
  spinWheel,
  startGame,
  submitAnswer,
} from "./live-games.ts";
import type { LiveGame, LiveView, Potato } from "./live-games.ts";
export const ROOM_CODE = /^\d{3}[A-Z]$/;
export const ROOM_TTL = 24 * 60 * 60 * 1000;
export interface Member extends Player {
  account: string;
  token: string;
  ticket?: string;
  ticketExpires?: number;
  authExpires?: number;
}
export interface Room {
  code: string;
  host: string;
  members: Member[];
  version: number;
  expires: number;
  game: LiveGame;
  category: Category;
  phase: "lobby" | "playing";
  round: number;
  /** Shuffled prompts for the card games. */
  deck: Prompt[];
  cursor: number;
  /** Private answers this round, keyed by member id, in arrival order. */
  votes: Record<string, string>;
  revealed: boolean;
  /** Points for the quiz games, explosions for Hot Potato. */
  scores: Record<string, number>;
  /** Shuffled indexes into the puzzle or question list. */
  queue: number[];
  cards: Card[];
  /** The wheel's landing field this round. */
  pick: number | null;
  potato: Potato | null;
}
export interface RoomView {
  code: string;
  host: string;
  members: Player[];
  version: number;
  expires: number;
  you: string;
  game: LiveGame;
  category: Category;
  phase: "lobby" | "playing";
  round: number;
  prompt: Prompt | null;
  activePlayer: string | null;
  voted: number;
  hasVoted: boolean;
  revealed: boolean;
  results: ReturnType<typeof voteResults> | null;
  scores: Record<string, number>;
  live: LiveView | null;
}
export class RoomError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}
export function createRoom(
  code: string,
  account: string,
  now = Date.now(),
): Room {
  const member = {
    id: crypto.randomUUID(),
    name: account,
    account,
    token: crypto.randomUUID(),
  };
  return {
    code,
    host: member.id,
    members: [member],
    version: 0,
    expires: now + ROOM_TTL,
    game: "most-likely",
    category: "all",
    phase: "lobby",
    round: 0,
    deck: [],
    cursor: 0,
    votes: {},
    revealed: false,
    scores: {},
    queue: [],
    cards: [],
    pick: null,
    potato: null,
  };
}
export function joinRoom(room: Room, account: string, token: string): Member {
  const existing = room.members.find((member) => member.account === account);
  if (existing) {
    if (existing.token !== token) {
      existing.token = crypto.randomUUID();
      delete existing.ticket;
    }
    return existing;
  }
  if (room.phase !== "lobby")
    throw new RoomError(
      "Spillet har startet. Be verten åpne lobbyen igjen.",
      409,
    );
  if (room.members.length >= 16) throw new RoomError("Rommet er fullt.", 409);
  const member = {
    id: crypto.randomUUID(),
    name: account,
    account,
    token: crypto.randomUUID(),
  };
  room.members.push(member);
  if (!room.host) room.host = member.id;
  return member;
}
export function applyRoomAction(
  room: Room,
  member: Member,
  input: Record<string, unknown>,
  now = Date.now(),
  random = Math.random,
): void {
  const action = input.action;
  if (action === "answer") submitAnswer(room, member.id, input);
  else if (action === "spin") spinWheel(room, member.id, random);
  else if (action === "pass") passPotato(room, member.id, input.target);
  else if (action === "vote") {
    if (
      room.phase !== "playing" ||
      room.game !== "most-likely" ||
      room.revealed ||
      input.round !== room.round
    )
      throw new RoomError("Avstemmingen er ikke åpen for denne runden.", 409);
    if (room.votes[member.id])
      throw new RoomError("Du har allerede stemt.", 409);
    if (
      typeof input.target !== "string" ||
      !room.members.some((player) => player.id === input.target)
    )
      throw new RoomError("Velg en spiller i rommet.");
    room.votes[member.id] = input.target;
  } else if (action === "leave") {
    room.members = room.members.filter((player) => player.id !== member.id);
    room.votes = Object.fromEntries(
      Object.entries(room.votes).filter(
        ([voter, target]) => voter !== member.id && target !== member.id,
      ),
    );
    if (room.host === member.id) room.host = room.members[0]?.id ?? "";
    dropPlayer(room, member.id);
    if (room.members.length < 2) {
      room.phase = "lobby";
      room.votes = {};
      room.revealed = false;
      room.potato = null;
    }
  } else {
    if (member.id !== room.host)
      throw new RoomError("Bare verten kan gjøre dette.", 403);
    if (input.version !== room.version)
      throw new RoomError("Rommet har endret seg. Prøv igjen.", 409);
    if (action === "settings") {
      if (room.phase !== "lobby")
        throw new RoomError("Åpne lobbyen før du endrer oppsettet.", 409);
      if (
        !isLiveGame(input.game) ||
        !["all", "vors", "hytta", "venner"].includes(String(input.category))
      )
        throw new RoomError("Ugyldig spilloppsett.");
      room.game = input.game;
      room.category = input.category as Category;
    } else if (action === "start") {
      if (room.phase !== "lobby")
        throw new RoomError("Spillet har allerede startet.", 409);
      if (room.members.length < 2)
        throw new RoomError("Inviter minst én venn først.");
      startGame(room, now, random);
    } else if (action === "next") {
      if (room.phase !== "playing")
        throw new RoomError("Spillet har ikke startet.", 409);
      advanceRound(room, now, random);
    } else if (action === "reveal") {
      if (
        room.phase !== "playing" ||
        !liveGame(room.game)?.answers ||
        room.revealed
      )
        throw new RoomError("Ingen runde å vise.", 409);
      if (Object.keys(room.votes).length === 0)
        throw new RoomError("Vent på minst ett svar først.");
      revealRound(room);
    } else if (action === "lobby") {
      room.phase = "lobby";
      room.deck = [];
      room.cursor = 0;
      room.votes = {};
      room.revealed = false;
      room.scores = {};
      room.queue = [];
      room.cards = [];
      room.pick = null;
      room.potato = null;
    } else throw new RoomError("Ukjent handling.");
  }
  room.version++;
}
/** Fills fields that rooms saved before a game was added do not have. */
export function normalizeRoom(room: Room): Room {
  room.scores ??= {};
  room.queue ??= [];
  room.cards ??= [];
  room.pick ??= null;
  room.potato ??= null;
  return room;
}
export function publicRoom(room: Room, memberId: string): RoomView {
  const members = room.members.map(({ id, name }) => ({ id, name }));
  return {
    code: room.code,
    host: room.host,
    members,
    version: room.version,
    expires: room.expires,
    you: memberId,
    game: room.game,
    category: room.category,
    phase: room.phase,
    round: room.round,
    prompt: room.phase === "playing" ? (room.deck[room.cursor] ?? null) : null,
    activePlayer:
      room.phase === "playing" && liveGame(room.game)?.turns
        ? (members[(room.round - 1) % members.length]?.id ?? null)
        : null,
    voted: Object.keys(room.votes).length,
    hasVoted: Boolean(room.votes[memberId]),
    revealed: room.revealed,
    results:
      room.revealed && room.game === "most-likely"
        ? voteResults(members, room.votes)
        : null,
    scores: room.scores,
    live: liveView(room),
  };
}
