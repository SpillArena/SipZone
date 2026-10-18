import { promptDeck, voteResults } from "./engine.ts";
import type { Player } from "./engine.ts";
import type { Category, PromptGame } from "./catalog.ts";
import type { Prompt } from "./content.ts";
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
  game: PromptGame;
  category: Category;
  phase: "lobby" | "playing";
  round: number;
  deck: Prompt[];
  cursor: number;
  votes: Record<string, string>;
  revealed: boolean;
}
export interface RoomView {
  code: string;
  host: string;
  members: Player[];
  version: number;
  expires: number;
  you: string;
  game: PromptGame;
  category: Category;
  phase: "lobby" | "playing";
  round: number;
  prompt: Prompt | null;
  activePlayer: string | null;
  voted: number;
  hasVoted: boolean;
  revealed: boolean;
  results: ReturnType<typeof voteResults> | null;
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
): void {
  const action = input.action;
  if (action === "vote") {
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
    if (room.members.length < 2) {
      room.phase = "lobby";
      room.votes = {};
      room.revealed = false;
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
        !["truth", "never", "most-likely"].includes(String(input.game)) ||
        !["all", "vors", "hytta", "venner"].includes(String(input.category))
      )
        throw new RoomError("Ugyldig spilloppsett.");
      room.game = input.game as PromptGame;
      room.category = input.category as Category;
    } else if (action === "start") {
      if (room.phase !== "lobby")
        throw new RoomError("Spillet har allerede startet.", 409);
      if (room.members.length < 2)
        throw new RoomError("Inviter minst én venn først.");
      room.phase = "playing";
      room.deck = promptDeck(room.game, room.category);
      room.cursor = 0;
      room.round = 1;
      room.votes = {};
      room.revealed = false;
    } else if (action === "next") {
      if (room.phase !== "playing")
        throw new RoomError("Spillet har ikke startet.", 409);
      room.cursor++;
      if (room.cursor >= room.deck.length) {
        const previous = room.deck.at(-1)?.id;
        room.deck = promptDeck(room.game, room.category);
        if (room.deck[0]?.id === previous && room.deck.length > 1)
          [room.deck[0], room.deck[1]] = [room.deck[1], room.deck[0]];
        room.cursor = 0;
      }
      room.round++;
      room.votes = {};
      room.revealed = false;
    } else if (action === "reveal") {
      if (room.phase !== "playing" || room.game !== "most-likely")
        throw new RoomError("Ingen avstemming å vise.", 409);
      if (Object.keys(room.votes).length === 0)
        throw new RoomError("Vent på minst én stemme først.");
      room.revealed = true;
    } else if (action === "lobby") {
      room.phase = "lobby";
      room.deck = [];
      room.cursor = 0;
      room.votes = {};
      room.revealed = false;
    } else throw new RoomError("Ukjent handling.");
  }
  room.version++;
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
    prompt: room.phase === "playing" ? room.deck[room.cursor] : null,
    activePlayer:
      room.phase === "playing"
        ? (members[(room.round - 1) % members.length]?.id ?? null)
        : null,
    voted: Object.keys(room.votes).length,
    hasVoted: Boolean(room.votes[memberId]),
    revealed: room.revealed,
    results: room.revealed ? voteResults(members, room.votes) : null,
  };
}
