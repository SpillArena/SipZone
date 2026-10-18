import { cardDeck, compareCards, potatoDuration, shuffle } from "./engine.ts";
import type { Card } from "./engine.ts";
import { promptDeck } from "./engine.ts";
import { rouletteOutcomes } from "./content.ts";
import type { Prompt } from "./content.ts";
import { dares, emojiPuzzles, quickQuestions } from "./party-content.ts";
import { matchesAnswer } from "./party-engine.ts";
import type { Room } from "./rooms.ts";
import { RoomError } from "./rooms.ts";

export type LiveGame =
  | "most-likely"
  | "truth"
  | "never"
  | "sip-dare"
  | "roulette"
  | "higher-lower"
  | "emoji"
  | "quickfire"
  | "hot-potato";

export interface LiveGameInfo {
  id: LiveGame;
  name: string;
  symbol: string;
  no: string;
  en: string;
  /** Everyone answers privately, then the host (or the last answer) reveals. */
  answers: boolean;
  /** One player is up each round. */
  turns: boolean;
  /** The category filter shapes the cards. */
  categories: boolean;
}
export const LIVE_GAMES: readonly LiveGameInfo[] = [
  {
    id: "most-likely",
    name: "Who’s Most Likely?",
    symbol: "☞",
    no: "Stem i skjul på hvem som passer best. Flest stemmer tar en slurk.",
    en: "Vote in secret on who fits best. Most votes takes a sip.",
    answers: true,
    turns: false,
    categories: true,
  },
  {
    id: "higher-lower",
    name: "Higher or Lower",
    symbol: "↕",
    no: "Alle gjetter samtidig om neste kort er høyere eller lavere. Feil gir slurk.",
    en: "Everyone guesses at once if the next card is higher or lower. Wrong takes a sip.",
    answers: true,
    turns: false,
    categories: false,
  },
  {
    id: "emoji",
    name: "Emoji Decoder",
    symbol: "😀",
    no: "Gjett filmen, sangen eller stedet bak emojiene. Raskest får bonus.",
    en: "Decode the emoji. The fastest correct answer earns a bonus point.",
    answers: true,
    turns: false,
    categories: false,
  },
  {
    id: "quickfire",
    name: "Quickfire",
    symbol: "⚡",
    no: "Quiz med fire svar. Riktig gir poeng, feil gir slurk.",
    en: "Four-choice quiz. Right earns points, wrong takes a sip.",
    answers: true,
    turns: false,
    categories: false,
  },
  {
    id: "hot-potato",
    name: "Hot Potato",
    symbol: "♨",
    no: "Gi poteten videre før den går av. Ingen vet når. Den som sitter igjen tar en slurk.",
    en: "Pass the potato before it goes off. Nobody knows when. Whoever holds it takes a sip.",
    answers: false,
    turns: false,
    categories: false,
  },
  {
    id: "roulette",
    name: "Sip Roulette",
    symbol: "✳",
    no: "Spilleren som er på tur snurrer hjulet. Alle ser utfallet.",
    en: "The player up spins the wheel. Everyone sees the result.",
    answers: false,
    turns: true,
    categories: false,
  },
  {
    id: "sip-dare",
    name: "Sip or Dare",
    symbol: "!",
    no: "Utfordringer for spilleren som er på tur. Utfør den eller ta en slurk.",
    en: "A dare for the player up. Do it or take a sip.",
    answers: false,
    turns: true,
    categories: true,
  },
  {
    id: "truth",
    name: "Truth or Sip",
    symbol: "?",
    no: "Spilleren på tur svarer ærlig, eller tar en slurk.",
    en: "The player up answers honestly, or takes a sip.",
    answers: false,
    turns: true,
    categories: true,
  },
  {
    id: "never",
    name: "Never Have I Ever",
    symbol: "“",
    no: "Alle som har gjort det tar en slurk.",
    en: "Anyone who has done it takes a sip.",
    answers: false,
    turns: false,
    categories: true,
  },
];
export const liveGame = (id: string) =>
  LIVE_GAMES.find((game) => game.id === id);
export const isLiveGame = (id: unknown): id is LiveGame =>
  LIVE_GAMES.some((game) => game.id === id);
const isPrompt = (game: LiveGame) =>
  ["truth", "never", "most-likely", "sip-dare"].includes(game);

export interface Potato {
  holder: string;
  deadline: number;
  exploded: boolean;
}
export type Outcome = "correct" | "wrong" | "tie";
export interface RoundResult {
  value: string;
  outcome: Outcome;
  points: number;
}
export type LiveView =
  | {
      kind: "higher-lower";
      current: Card;
      next: Card | null;
      results: Record<string, RoundResult> | null;
    }
  | {
      kind: "emoji";
      emoji: string;
      topic: string;
      answer: string | null;
      results: Record<string, RoundResult> | null;
    }
  | {
      kind: "quickfire";
      question: string;
      choices: readonly string[];
      answer: number | null;
      results: Record<string, RoundResult> | null;
    }
  | { kind: "roulette"; outcome: number | null }
  | { kind: "hot-potato"; holder: string; exploded: boolean };

const DARES: Prompt[] = dares.map((dare, index) => ({
  id: `dare-${dare.level}-${index}`,
  text: dare.text,
  category: dare.category,
}));
function dareDeck(room: Room, random: () => number): Prompt[] {
  return shuffle(
    DARES.filter(
      (dare) => room.category === "all" || dare.category === room.category,
    ),
    random,
  );
}
function queueFor(game: LiveGame, random: () => number): number[] {
  const size =
    game === "emoji"
      ? emojiPuzzles.length
      : game === "quickfire"
        ? quickQuestions.length
        : 0;
  return shuffle(
    Array.from({ length: size }, (_, index) => index),
    random,
  );
}
function newPotato(room: Room, now: number, random: () => number): Potato {
  const holder = room.members[Math.floor(random() * room.members.length)];
  return {
    holder: holder.id,
    deadline: now + potatoDuration(random),
    exploded: false,
  };
}
function resetRound(room: Room) {
  room.votes = {};
  room.revealed = false;
  room.pick = null;
}

/** Fresh decks and counters for the room's current game. */
export function startGame(
  room: Room,
  now = Date.now(),
  random = Math.random,
): void {
  room.phase = "playing";
  room.round = 1;
  room.cursor = 0;
  room.scores = {};
  room.deck = [];
  room.queue = [];
  room.cards = [];
  room.potato = null;
  resetRound(room);
  fillDeck(room, now, random);
}
function fillDeck(room: Room, now: number, random: () => number) {
  const game = room.game;
  if (game === "sip-dare") room.deck = dareDeck(room, random);
  else if (isPrompt(game))
    room.deck = promptDeck(game as "truth", room.category, random);
  else if (game === "higher-lower") room.cards = cardDeck(random);
  else if (game === "emoji" || game === "quickfire")
    room.queue = queueFor(game, random);
  else if (game === "hot-potato") room.potato = newPotato(room, now, random);
}
/** Moves to the next prompt, card, question or potato. */
export function advanceRound(
  room: Room,
  now = Date.now(),
  random = Math.random,
): void {
  const game = room.game;
  room.cursor++;
  if (isPrompt(game) && room.cursor >= room.deck.length) {
    const previous = room.deck.at(-1)?.id;
    fillDeck(room, now, random);
    if (room.deck[0]?.id === previous && room.deck.length > 1)
      [room.deck[0], room.deck[1]] = [room.deck[1], room.deck[0]];
    room.cursor = 0;
  } else if (game === "higher-lower" && room.cursor + 1 >= room.cards.length) {
    fillDeck(room, now, random);
    room.cursor = 0;
  } else if (
    (game === "emoji" || game === "quickfire") &&
    room.cursor >= room.queue.length
  ) {
    const previous = room.queue.at(-1);
    fillDeck(room, now, random);
    if (room.queue[0] === previous && room.queue.length > 1)
      [room.queue[0], room.queue[1]] = [room.queue[1], room.queue[0]];
    room.cursor = 0;
  } else if (game === "hot-potato") room.potato = newPotato(room, now, random);
  room.round++;
  resetRound(room);
}

const puzzle = (room: Room) => emojiPuzzles[room.queue[room.cursor]];
const question = (room: Room) => quickQuestions[room.queue[room.cursor]];

/** How each answer fared this round, in the order the answers arrived. */
function judge(room: Room): Record<string, RoundResult> {
  const results: Record<string, RoundResult> = {};
  let bonus = room.game === "emoji" || room.game === "quickfire";
  for (const [id, value] of Object.entries(room.votes)) {
    if (!room.members.some((member) => member.id === id)) continue;
    let outcome: Outcome = "wrong";
    if (room.game === "higher-lower")
      outcome = compareCards(
        room.cards[room.cursor],
        room.cards[room.cursor + 1],
        value as "higher" | "lower",
      );
    else if (room.game === "emoji") {
      const current = puzzle(room);
      if (matchesAnswer(value, [current.answer, ...(current.aliases ?? [])]))
        outcome = "correct";
    } else if (room.game === "quickfire")
      outcome = Number(value) === question(room).answer ? "correct" : "wrong";
    let points = outcome === "correct" ? 1 : 0;
    if (outcome === "correct" && bonus) {
      points++;
      bonus = false;
    }
    results[id] = { value, outcome, points };
  }
  return results;
}
/** Closes the round: scores the answers and shows the result to everyone. */
export function revealRound(room: Room): void {
  if (room.game !== "most-likely")
    for (const [id, result] of Object.entries(judge(room)))
      if (result.points)
        room.scores[id] = (room.scores[id] ?? 0) + result.points;
  room.revealed = true;
}

const ANSWERS: Partial<
  Record<LiveGame, (value: unknown, room: Room) => string | null>
> = {
  "higher-lower": (value) =>
    value === "higher" || value === "lower" ? value : null,
  emoji: (value) =>
    typeof value === "string" && value.trim() && value.length <= 60
      ? value.trim()
      : null,
  quickfire: (value, room) => {
    const index = typeof value === "string" ? Number(value) : NaN;
    return Number.isInteger(index) &&
      index >= 0 &&
      index < question(room).choices.length
      ? String(index)
      : null;
  },
};
/** One private answer per player per round. The last answer reveals the round. */
export function submitAnswer(
  room: Room,
  memberId: string,
  input: Record<string, unknown>,
): void {
  const parse = ANSWERS[room.game];
  if (
    !parse ||
    room.phase !== "playing" ||
    room.revealed ||
    input.round !== room.round
  )
    throw new RoomError("Svarene er ikke åpne for denne runden.", 409);
  if (room.votes[memberId]) throw new RoomError("Du har allerede svart.", 409);
  const value = parse(input.value, room);
  if (value === null) throw new RoomError("Ugyldig svar.");
  room.votes[memberId] = value;
  if (room.members.every((member) => room.votes[member.id])) revealRound(room);
}
export function spinWheel(room: Room, memberId: string, random = Math.random) {
  const active = room.members[(room.round - 1) % room.members.length];
  if (room.game !== "roulette" || room.phase !== "playing")
    throw new RoomError("Hjulet er ikke i spill.", 409);
  if (active?.id !== memberId)
    throw new RoomError("Det er ikke din tur til å snurre.", 403);
  if (room.pick !== null)
    throw new RoomError("Hjulet har allerede snurret.", 409);
  room.pick = Math.floor(random() * rouletteOutcomes.length);
}
export function passPotato(room: Room, memberId: string, target: unknown) {
  const potato = room.potato;
  if (room.game !== "hot-potato" || room.phase !== "playing" || !potato)
    throw new RoomError("Ingen potet i spill.", 409);
  if (potato.exploded)
    throw new RoomError("Poteten har allerede gått av.", 409);
  if (potato.holder !== memberId)
    throw new RoomError("Du holder ikke poteten.", 403);
  if (
    typeof target !== "string" ||
    target === memberId ||
    !room.members.some((member) => member.id === target)
  )
    throw new RoomError("Velg en annen spiller i rommet.");
  potato.holder = target;
}
/** Explodes the potato once its deadline has passed. Returns true when the room changed. */
export function tick(room: Room, now = Date.now()): boolean {
  const potato = room.potato;
  if (
    room.phase !== "playing" ||
    room.game !== "hot-potato" ||
    !potato ||
    potato.exploded ||
    now < potato.deadline
  )
    return false;
  potato.exploded = true;
  room.scores[potato.holder] = (room.scores[potato.holder] ?? 0) + 1;
  return true;
}
/** When the room next needs to wake up on its own. */
export function nextWake(room: Room): number {
  const potato = room.potato;
  return room.phase === "playing" &&
    room.game === "hot-potato" &&
    potato &&
    !potato.exploded
    ? Math.min(room.expires, potato.deadline)
    : room.expires;
}
/** Removes a leaving player's state from the live game. */
export function dropPlayer(room: Room, memberId: string): void {
  delete room.scores[memberId];
  if (room.potato && room.potato.holder === memberId && !room.potato.exploded) {
    const next = room.members[0];
    if (next) room.potato.holder = next.id;
  }
}

export function liveView(room: Room): LiveView | null {
  if (room.phase !== "playing") return null;
  const results = room.revealed ? judge(room) : null;
  if (room.game === "higher-lower")
    return {
      kind: "higher-lower",
      current: room.cards[room.cursor],
      next: room.revealed ? room.cards[room.cursor + 1] : null,
      results,
    };
  if (room.game === "emoji") {
    const current = puzzle(room);
    return {
      kind: "emoji",
      emoji: current.emoji,
      topic: current.topic,
      answer: room.revealed ? current.answer : null,
      results,
    };
  }
  if (room.game === "quickfire") {
    const current = question(room);
    return {
      kind: "quickfire",
      question: current.question,
      choices: current.choices,
      answer: room.revealed ? current.answer : null,
      results,
    };
  }
  if (room.game === "roulette") return { kind: "roulette", outcome: room.pick };
  if (room.game === "hot-potato" && room.potato)
    return {
      kind: "hot-potato",
      holder: room.potato.holder,
      exploded: room.potato.exploded,
    };
  return null;
}
