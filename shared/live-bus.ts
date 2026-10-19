import {
  BUS_MAX_PLAYERS,
  createBusGame,
  hEffect,
  playBus,
  type BusAction,
  type BusGuess,
  type BusState,
} from "./bus.ts";
import type { Card } from "./engine.ts";
import type { Member, Room } from "./rooms.ts";
import { RoomError } from "./rooms.ts";

/**
 * H-en + Bussruta on everyone's own phone.
 *
 * The rules are the pass-and-play engine in bus.ts, unchanged. What this file
 * adds is who may do what from which phone, and what each phone may see:
 * every player gets their own hand and nobody else's, and the H, the guess
 * cards and the pyramid only reach the phones once they are turned.
 *
 * The engine's hand-over steps ("give the phone to …") have no meaning here.
 * A player lays a card straight from their own hand, naming the recipient in
 * the same request when the card gives a sip away, so several players can
 * lay on the same H card at once.
 */

/** One card laid on the open H card, for everyone to see who drinks. */
export interface BusPlay {
  player: number;
  card: Card;
  recipient: number;
}
export interface LiveBusView {
  kind: "bus";
  players: { id: string; name: string; cards: number }[];
  /** Your index in `players`, or -1 when you joined after the deal. */
  you: number;
  hand: Card[];
  phase: BusState["phase"];
  /** The H, with the cards that are still face down left out. */
  h: (Card | null)[];
  hIndex: number;
  hStage: "intro" | "covered" | "open";
  plays: BusPlay[];
  driverCandidates: number[];
  drivers: number[];
  deal: {
    player: number;
    question: number;
    stage: "guess" | "feedback";
    correct: boolean | null;
    recipient: number | null;
    cards: (Card | null)[];
  };
  bus: BusState["bus"] & { pyramid: (Card | null)[] };
  endReason: BusState["endReason"];
}

/** Moves the host makes for the whole table; they carry the room revision. */
const PACED = new Set([
  "start-h",
  "reveal-h",
  "next-h",
  "choose-driver",
  "ride-together",
  "next-player",
  "start-bus",
  "next-row",
  "retry-bus",
  "skip-bus",
]);

export function startLiveBus(room: Room, random = Math.random): void {
  if (room.members.length > BUS_MAX_PLAYERS)
    throw new RoomError(
      `H-en + Bussruta er for høyst ${BUS_MAX_PLAYERS} spillere.`,
    );
  room.bus = settle(
    createBusGame(
      room.members.map(({ id, name }) => ({ id, name })),
      random,
    ),
  );
  room.busPlays = [];
}

/** The engine pauses for a phone hand-over before every guess; here nobody needs to. */
function settle(state: BusState): BusState {
  return state.phase === "deal" && state.deal.stage === "handoff"
    ? playBus(state, { type: "confirm-deal" })
    : state;
}

const seat = (state: BusState, id: unknown) =>
  typeof id === "string"
    ? state.players.findIndex((player) => player.id === id)
    : -1;

function apply(state: BusState, action: BusAction, random: () => number) {
  const next = playBus(state, action, random);
  if (next === state)
    throw new RoomError("Det trekket går ikke akkurat nå.", 409);
  return settle(next);
}

export function busMove(
  room: Room,
  member: Member,
  input: Record<string, unknown>,
  random = Math.random,
): void {
  const state = room.bus;
  if (room.phase !== "playing" || room.game !== "bus" || !state)
    throw new RoomError("Bussruta er ikke i gang.", 409);
  const move = String(input.move);
  const me = seat(state, member.id);
  const host = member.id === room.host;
  if (PACED.has(move) && input.version !== room.version)
    throw new RoomError("Rommet har endret seg. Prøv igjen.", 409);

  if (move === "play-card") {
    if (me < 0) throw new RoomError("Du er ikke med i denne runden.", 403);
    if (state.phase !== "h" || state.table.stage !== "open")
      throw new RoomError("Vent til H-kortet er snudd.", 409);
    const slot = state.hands[me].findIndex(
      (card) => card.rank === input.rank && card.suit === input.suit,
    );
    if (slot < 0) throw new RoomError("Det kortet har du ikke lenger.", 409);
    const give = hEffect(state.table.index) === "give";
    const recipient = seat(state, input.recipient);
    if (give && (recipient < 0 || recipient === me))
      throw new RoomError("Velg hvem som skal drikke.");
    // the engine lets one viewer hold the phone at a time; here the player is
    // already holding their own
    let next = apply(
      { ...state, table: { ...state.table, stage: "hand", viewer: me } },
      { type: "play-card", slot },
      random,
    );
    if (give) next = apply(next, { type: "award", recipient }, random);
    room.busPlays.push({
      player: me,
      card: state.hands[me][slot],
      recipient: give ? recipient : me,
    });
    room.bus = next;
    return;
  }

  let action: BusAction;
  if (move === "start-h" || move === "reveal-h" || move === "next-h") {
    if (!host) throw new RoomError("Bare verten snur H-en.", 403);
    action = { type: move };
  } else if (move === "choose-driver" || move === "ride-together") {
    if (!host)
      throw new RoomError("Bare verten velger hvem som tar bussen.", 403);
    action =
      move === "ride-together"
        ? { type: move }
        : { type: move, player: seat(state, input.player) };
  } else if (
    move === "deal-guess" ||
    move === "deal-award" ||
    move === "next-player"
  ) {
    const up = state.phase === "deal" && state.deal.player === me;
    // the host can move a stuck turn along, but only the player guesses
    if (!up && !(host && move === "next-player"))
      throw new RoomError("Det er ikke din tur.", 403);
    action =
      move === "deal-guess"
        ? { type: move, guess: input.guess as BusGuess }
        : move === "deal-award"
          ? { type: move, recipient: seat(state, input.recipient) }
          : { type: move };
  } else if (
    move === "start-bus" ||
    move === "pick-pyramid" ||
    move === "next-row" ||
    move === "retry-bus" ||
    move === "skip-bus"
  ) {
    if (!state.drivers.includes(me) && !host)
      throw new RoomError("Bare de på bussen velger kort.", 403);
    action =
      move === "pick-pyramid"
        ? { type: move, index: Number(input.index) }
        : { type: move };
  } else throw new RoomError("Ukjent trekk.");

  room.bus = apply(state, action, random);
  if (move === "next-h") room.busPlays = [];
}

/** A player leaving takes their cards with them; the bus cannot go on without a driver. */
export function dropBusPlayer(room: Room, memberId: string): void {
  if (!room.bus || seat(room.bus, memberId) < 0) return;
  room.bus = null;
  room.busPlays = [];
  if (room.game === "bus") room.phase = "lobby";
}

export function busView(room: Room, memberId: string): LiveBusView | null {
  const state = room.bus;
  if (!state) return null;
  const me = seat(state, memberId);
  const { table, deal, bus } = state;
  const shown = deal.question + (deal.stage === "feedback" ? 1 : 0);
  return {
    kind: "bus",
    players: state.players.map(({ id, name }, index) => ({
      id,
      name,
      cards: state.hands[index].length,
    })),
    you: me,
    hand: me < 0 ? [] : state.hands[me],
    phase: state.phase,
    h: state.h.map((card, index) =>
      index < table.index || (index === table.index && table.stage === "open")
        ? card
        : null,
    ),
    hIndex: table.index,
    hStage:
      table.stage === "intro" || table.stage === "covered"
        ? table.stage
        : "open",
    plays: room.busPlays,
    driverCandidates: state.driverCandidates,
    drivers: state.drivers,
    deal: {
      player: deal.player,
      question: deal.question,
      stage: deal.stage === "feedback" ? "feedback" : "guess",
      correct: deal.correct,
      recipient: deal.recipient,
      cards: state.guessHands[deal.player].map((card, index) =>
        index < shown ? card : null,
      ),
    },
    bus: {
      ...bus,
      pyramid: state.pyramid.map((card, index) =>
        bus.picks.includes(index) ? card : null,
      ),
    },
    endReason: state.endReason,
  };
}
