import {
  BUS_MAX_PLAYERS,
  createBusGame,
  hEffect,
  playBus,
  pyramidPenalty,
  type BusAction,
  type BusGuess,
  type BusState,
  type BusDealResult,
  type BusDrink,
  type BusPhaseIntro,
} from "./bus.ts";
import type { Card } from "./engine.ts";
import type { Member, Room } from "./rooms.ts";
import { RoomError } from "./rooms.ts";

/**
 * H-en + Bussruta on everyone's own phone.
 *
 * Live players may lay onto any revealed matching H card. This file also
 * controls who may do what from which phone, and what each phone may see:
 * every player gets their own hand and nobody else's, and the H, the guess
 * cards and the pyramid only reach the phones once they are turned.
 *
 * The engine's hand-over steps ("give the phone to …") have no meaning here.
 * A player chooses a revealed H card from their own hand, naming the recipient
 * in the same request when that target gives a sip away. Several players can
 * lay on the same H card at once.
 */

/** One card laid on a revealed H card, for everyone to see who drinks. */
export interface BusPlay {
  player: number;
  card: Card;
  recipient: number;
  /** Missing only in rooms saved before choosing a target was supported. */
  hIndex?: number;
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
  pendingDrinks: BusDrink[];
  phaseIntro: BusPhaseIntro | null;
  driverCandidates: number[];
  drivers: number[];
  deal: {
    player: number;
    question: number;
    stage: "guess" | "feedback";
    correct: boolean | null;
    recipient: number | null;
    cards: (Card | null)[];
    results: BusDealResult[];
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
  "deal-guess",
  "deal-award",
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
  room.bus.phaseIntro = { id: crypto.randomUUID(), phase: "deal", ready: [] };
}

/** The engine pauses for a phone hand-over before every guess; here nobody needs to. */
function settle(state: BusState): BusState {
  if (state.phase === "h" && state.table.stage === "intro")
    return playBus(state, { type: "start-h" });
  if (state.phase === "bus" && state.bus.stage === "ready")
    return playBus(state, { type: "start-bus" });
  if (
    state.phase === "bus" &&
    state.bus.stage === "feedback" &&
    !state.bus.failed
  )
    return playBus(state, { type: "next-row" });
  return state.phase === "deal" && state.deal.stage === "handoff"
    ? playBus(state, { type: "confirm-deal" })
    : state;
}

const seat = (state: BusState, id: unknown) =>
  typeof id === "string"
    ? state.players.findIndex((player) => player.id === id)
    : -1;

/** Resume feedback saved by the earlier manual turn flow. */
export function normalizeLiveBus(state: BusState): BusState {
  state.dealResults ??= [];
  state.pendingDrinks ??= [];
  state.phaseIntro ??= null;
  if (state.phase === "deal" && state.deal.stage === "feedback") {
    const deal = state.deal;
    if (
      !state.dealResults.some(
        (result) =>
          result.player === deal.player && result.question === deal.question,
      )
    ) {
      state.dealResults.push({
        player: deal.player,
        question: deal.question,
        card: state.guessHands[deal.player][deal.question],
        correct: Boolean(deal.correct),
        recipient: deal.recipient,
      });
    }
    if (
      (!deal.correct || deal.recipient !== null) &&
      !state.pendingDrinks.length
    )
      state.pendingDrinks = [
        {
          id: `deal:${deal.player}:${deal.question}`,
          player: deal.correct ? deal.recipient! : deal.player,
          sips: deal.question + 1,
          shots: 0,
          from: deal.correct ? deal.player : null,
        },
      ];
  }
  return settle(state);
}

function apply(
  state: BusState,
  action: BusAction,
  random: () => number,
): BusState {
  const next = playBus(state, action, random);
  if (next === state)
    throw new RoomError("Det trekket går ikke akkurat nå.", 409);
  const settled = settle(next);
  if (
    settled.phase !== state.phase &&
    (settled.phase === "deal" ||
      settled.phase === "h" ||
      settled.phase === "bus")
  ) {
    return {
      ...settled,
      phaseIntro: { id: crypto.randomUUID(), phase: settled.phase, ready: [] },
    };
  }
  return settled;
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
  state.pendingDrinks ??= [];
  if (move === "confirm-drink") {
    const drink = state.pendingDrinks.find(
      (drink) => drink.id === input.drinkId,
    );
    if (!drink)
      throw new RoomError("Denne bekreftelsen er ikke aktiv lenger.", 409);
    if (drink.player !== me)
      throw new RoomError("Bare den som skal drikke kan bekrefte.", 403);
    let next = {
      ...state,
      pendingDrinks: state.pendingDrinks.filter(
        (pending) => pending.id !== drink.id,
      ),
    };
    if (
      !next.pendingDrinks.length &&
      next.phase === "deal" &&
      next.deal.stage === "feedback" &&
      (!next.deal.correct || next.deal.recipient !== null)
    )
      next = apply(next, { type: "next-player" }, random);
    else if (
      !next.pendingDrinks.length &&
      next.phase === "bus" &&
      next.bus.stage === "feedback" &&
      next.bus.failed
    )
      next = apply(next, { type: "retry-bus" }, random);
    room.bus = next;
    return;
  }
  if (state.pendingDrinks.length)
    throw new RoomError("Venter på at den som drikker bekrefter.", 409);
  if (move === "ready-phase") {
    const intro = state.phaseIntro;
    if (!intro || input.introId !== intro.id)
      throw new RoomError("Denne introen er ikke aktiv lenger.", 409);
    if (me < 0) throw new RoomError("Du er ikke med i denne runden.", 403);
    const ready = [...new Set([...intro.ready, me])];
    room.bus = {
      ...state,
      phaseIntro:
        ready.length === state.players.length ? null : { ...intro, ready },
    };
    return;
  }
  if (state.phaseIntro)
    throw new RoomError("Venter på at alle spillerne er klare.", 409);
  if (PACED.has(move) && input.version !== room.version)
    throw new RoomError("Rommet har endret seg. Prøv igjen.", 409);

  if (move === "play-card") {
    if (me < 0) throw new RoomError("Du er ikke med i denne runden.", 403);
    const target =
      input.hIndex === undefined ? state.table.index : input.hIndex;
    if (
      state.phase !== "h" ||
      typeof target !== "number" ||
      !Number.isInteger(target) ||
      target < 0 ||
      target > state.table.index ||
      (target === state.table.index && state.table.stage !== "open")
    )
      throw new RoomError("Vent til H-kortet er snudd.", 409);
    const slot = state.hands[me].findIndex(
      (card) => card.rank === input.rank && card.suit === input.suit,
    );
    if (slot < 0) throw new RoomError("Det kortet har du ikke lenger.", 409);
    const give = hEffect(target) === "give";
    const recipient = seat(state, input.recipient);
    if (give && (recipient < 0 || recipient === me))
      throw new RoomError("Velg hvem som skal drikke.");
    // the engine lets one viewer hold the phone at a time; here the player is
    // already holding their own
    let next = apply(
      {
        ...state,
        table: { ...state.table, index: target, stage: "hand", viewer: me },
      },
      { type: "play-card", slot },
      random,
    );
    if (give) next = apply(next, { type: "award", recipient }, random);
    room.busPlays.push({
      player: me,
      card: state.hands[me][slot],
      recipient: give ? recipient : me,
      hIndex: target,
    });
    room.bus = {
      ...next,
      pendingDrinks: [
        {
          id: `h:${input.rank}:${input.suit}`,
          player: give ? recipient : me,
          sips: hEffect(target) === "shot" ? 0 : 1,
          shots: hEffect(target) === "shot" ? 1 : 0,
          from: give ? me : null,
        },
      ],
      // Playing onto an older card must not move or reveal the host's next card.
      table: {
        ...next.table,
        index: state.table.index,
        stage: state.table.stage,
        viewer: null,
      },
    };
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
  if (
    (move === "deal-guess" || move === "deal-award") &&
    room.bus.phase === "deal" &&
    room.bus.deal.stage === "feedback" &&
    (!room.bus.deal.correct || room.bus.deal.recipient !== null)
  ) {
    const deal = room.bus.deal;
    room.bus = {
      ...room.bus,
      pendingDrinks: [
        {
          id: `deal:${deal.player}:${deal.question}`,
          player: deal.correct ? deal.recipient! : deal.player,
          sips: deal.question + 1,
          shots: 0,
          from: deal.correct ? deal.player : null,
        },
      ],
    };
  }
  if (
    move === "pick-pyramid" &&
    room.bus.phase === "bus" &&
    room.bus.bus.failed
  ) {
    const penalty = pyramidPenalty(room.bus.bus.row);
    room.bus = {
      ...room.bus,
      pendingDrinks: room.bus.drivers.map((player) => ({
        id: `pyramid:${room.bus!.bus.attempt}:${room.bus!.bus.row}:${player}`,
        player,
        sips: penalty.shot ? 0 : penalty.sips,
        shots: penalty.shot ? 1 : 0,
        from: null,
      })),
    };
  }
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
    pendingDrinks: state.pendingDrinks ?? [],
    phaseIntro: state.phaseIntro ?? null,
    driverCandidates: state.driverCandidates,
    drivers: state.drivers,
    deal: {
      player: deal.player,
      question: deal.question,
      stage: deal.stage === "feedback" ? "feedback" : "guess",
      correct: deal.correct,
      recipient: deal.recipient,
      results: state.dealResults ?? [],
      cards: (state.phase === "deal" ? state.guessHands[deal.player] : []).map(
        (card, index) => (index < shown ? card : null),
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
