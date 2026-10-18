import {
  cardDeck,
  compareCards,
  validateNames,
  type Card,
  type Player,
  type Suit,
} from "./engine.ts";
export const BUS_MAX_PLAYERS = 8;
export const BUS_ATTEMPTS = 3;
export const BUS_ROUTE_LENGTH = 5;
export type BusGuess =
  "red" | "black" | "higher" | "lower" | "inside" | "outside" | Suit;
export function busValue(card: Card) {
  return card.rank === 1 ? 14 : card.rank;
}
export function busGuessCorrect(
  hand: readonly Card[],
  question: number,
  guess: BusGuess,
): boolean {
  const card = hand[question];
  if (!card) return false;
  if (question === 0)
    return (
      (guess === "red" || guess === "black") &&
      (card.suit === "♥" || card.suit === "♦") === (guess === "red")
    );
  if (question === 1)
    return (
      (guess === "higher" || guess === "lower") &&
      compareCards(hand[0], card, guess, { ace: "high", ties: "lose" }) ===
        "correct"
    );
  if (question === 2) {
    if (guess !== "inside" && guess !== "outside") return false;
    const a = busValue(hand[0]),
      b = busValue(hand[1]),
      value = busValue(card);
    if (value === a || value === b) return false;
    const inside = value > Math.min(a, b) && value < Math.max(a, b);
    return guess === "inside" ? inside : !inside;
  }
  return (
    question === 3 &&
    (["♠", "♥", "♣", "♦"] as string[]).includes(guess) &&
    card.suit === guess
  );
}
export function pyramidRow(index: number) {
  if (!Number.isInteger(index) || index < 0 || index >= 15)
    throw new Error("Ugyldig pyramidekort.");
  return index < 5 ? 1 : index < 9 ? 2 : index < 12 ? 3 : index < 14 ? 4 : 5;
}
export function busCandidates(hands: readonly (readonly Card[])[]) {
  const max = Math.max(0, ...hands.map((hand) => hand.length));
  return max === 0
    ? []
    : hands.flatMap((hand, index) => (hand.length === max ? [index] : []));
}
export interface BusState {
  players: Player[];
  hands: Card[][];
  pyramid: Card[];
  routes: Card[][];
  phase: "deal" | "pyramid" | "driver" | "bus" | "done";
  deal: {
    player: number;
    question: number;
    stage: "handoff" | "guess" | "feedback" | "memory";
    correct: boolean | null;
  };
  table: {
    index: number;
    stage: "intro" | "covered" | "open" | "handoff" | "hand" | "award";
    viewer: number | null;
    played: Card | null;
    recipient: number | null;
  };
  scores: number[];
  driverCandidates: number[];
  driver: number | null;
  driverLot: number;
  bus: {
    attempt: number;
    cursor: number;
    stage: "ready" | "guess" | "feedback";
    correct: boolean | null;
    failures: number;
  };
  endReason: "no-driver" | "cleared" | "attempt-limit" | "skipped" | null;
}
export function createBusGame(
  players: Player[],
  random = Math.random,
): BusState {
  const invalid = validateNames(
    players.map((player) => player.name),
    2,
    BUS_MAX_PLAYERS,
  );
  if (
    invalid ||
    new Set(players.map((player) => player.id)).size !== players.length
  )
    throw new Error(invalid ?? "Spillerne må ha unike ID-er.");
  const deck = cardDeck(random);
  return {
    players: players.map((player) => ({ ...player })),
    hands: players.map((_, index) => deck.slice(index * 4, index * 4 + 4)),
    pyramid: deck.slice(players.length * 4, players.length * 4 + 15),
    routes: Array.from({ length: BUS_ATTEMPTS }, () =>
      cardDeck(random).slice(0, BUS_ROUTE_LENGTH),
    ),
    phase: "deal",
    deal: { player: 0, question: 0, stage: "handoff", correct: null },
    table: {
      index: 0,
      stage: "intro",
      viewer: null,
      played: null,
      recipient: null,
    },
    scores: players.map(() => 0),
    driverCandidates: [],
    driver: null,
    driverLot: random(),
    bus: { attempt: 0, cursor: 1, stage: "ready", correct: null, failures: 0 },
    endReason: null,
  };
}
export type BusAction =
  | { type: "confirm-deal" }
  | { type: "deal-guess"; guess: BusGuess }
  | { type: "next-question" }
  | { type: "hide-hand" }
  | { type: "start-pyramid" }
  | { type: "reveal-pyramid" }
  | { type: "view-hand"; player: number }
  | { type: "confirm-hand" }
  | { type: "close-hand" }
  | { type: "play-card"; slot: number }
  | { type: "award"; recipient: number | null }
  | { type: "next-pyramid" }
  | { type: "draw-driver" }
  | { type: "start-bus" }
  | { type: "bus-guess"; guess: "higher" | "lower" }
  | { type: "next-stop" }
  | { type: "retry-bus" }
  | { type: "skip-bus" };
function finishPyramid(state: BusState): BusState {
  const candidates = busCandidates(state.hands);
  if (!candidates.length)
    return {
      ...state,
      phase: "done",
      endReason: "no-driver",
      driverCandidates: [],
    };
  return {
    ...state,
    phase: candidates.length === 1 ? "bus" : "driver",
    driverCandidates: candidates,
    driver: candidates.length === 1 ? candidates[0] : null,
  };
}
/** Every action is gated by phase and reveal state, so a repeated tap cannot consume another card. */
export function playBus(state: BusState, action: BusAction): BusState {
  const { deal, table, bus } = state;
  if (state.phase === "done") return state;
  if (state.phase === "deal") {
    if (action.type === "confirm-deal" && deal.stage === "handoff")
      return { ...state, deal: { ...deal, stage: "guess" } };
    if (action.type === "deal-guess" && deal.stage === "guess") {
      const allowed: BusGuess[][] = [
        ["red", "black"],
        ["higher", "lower"],
        ["inside", "outside"],
        ["♠", "♥", "♣", "♦"],
      ];
      if (!allowed[deal.question].includes(action.guess)) return state;
      const correct = busGuessCorrect(
        state.hands[deal.player],
        deal.question,
        action.guess,
      );
      return {
        ...state,
        deal: { ...deal, stage: "feedback", correct },
        scores: state.scores.map(
          (score, index) => score + (index === deal.player && correct ? 1 : 0),
        ),
      };
    }
    if (action.type === "next-question" && deal.stage === "feedback")
      return {
        ...state,
        deal: {
          ...deal,
          stage: deal.question === 3 ? "memory" : "guess",
          question: Math.min(3, deal.question + 1),
          correct: null,
        },
      };
    if (action.type === "hide-hand" && deal.stage === "memory") {
      if (deal.player + 1 === state.players.length)
        return { ...state, phase: "pyramid" };
      return {
        ...state,
        deal: {
          player: deal.player + 1,
          question: 0,
          stage: "handoff",
          correct: null,
        },
      };
    }
    return state;
  }
  if (state.phase === "pyramid") {
    if (action.type === "start-pyramid" && table.stage === "intro")
      return { ...state, table: { ...table, stage: "covered" } };
    if (action.type === "reveal-pyramid" && table.stage === "covered")
      return { ...state, table: { ...table, stage: "open" } };
    if (
      action.type === "view-hand" &&
      table.stage === "open" &&
      Number.isInteger(action.player) &&
      state.hands[action.player]?.length
    )
      return {
        ...state,
        table: {
          ...table,
          stage: "handoff",
          viewer: action.player,
          played: null,
          recipient: null,
        },
      };
    if (action.type === "confirm-hand" && table.stage === "handoff")
      return { ...state, table: { ...table, stage: "hand" } };
    if (
      action.type === "close-hand" &&
      (table.stage === "hand" || table.stage === "handoff")
    )
      return { ...state, table: { ...table, stage: "open", viewer: null } };
    if (
      action.type === "play-card" &&
      table.stage === "hand" &&
      table.viewer !== null &&
      Number.isInteger(action.slot)
    ) {
      const card = state.hands[table.viewer][action.slot];
      if (!card || card.rank !== state.pyramid[table.index].rank) return state;
      return {
        ...state,
        hands: state.hands.map((hand, index) =>
          index === table.viewer
            ? hand.filter((_, slot) => slot !== action.slot)
            : hand,
        ),
        scores: state.scores.map((score, index) =>
          index === table.viewer ? score + pyramidRow(table.index) : score,
        ),
        table: { ...table, stage: "award", played: card, recipient: null },
      };
    }
    if (action.type === "award" && table.stage === "award") {
      if (
        action.recipient !== null &&
        (!Number.isInteger(action.recipient) ||
          !state.players[action.recipient] ||
          action.recipient === table.viewer)
      )
        return state;
      return {
        ...state,
        table: {
          ...table,
          stage: "open",
          recipient: action.recipient,
          viewer: null,
        },
      };
    }
    if (action.type === "next-pyramid" && table.stage === "open") {
      if (table.index === 14 || state.hands.every((hand) => hand.length === 0))
        return finishPyramid(state);
      return {
        ...state,
        table: {
          index: table.index + 1,
          stage: "covered",
          viewer: null,
          played: null,
          recipient: null,
        },
      };
    }
    return state;
  }
  if (state.phase === "driver") {
    if (action.type !== "draw-driver") return state;
    const chosen =
      state.driverCandidates[
        Math.min(
          state.driverCandidates.length - 1,
          Math.floor(state.driverLot * state.driverCandidates.length),
        )
      ];
    return { ...state, phase: "bus", driver: chosen };
  }
  if (action.type === "skip-bus")
    return { ...state, phase: "done", endReason: "skipped" };
  if (action.type === "start-bus" && bus.stage === "ready")
    return { ...state, bus: { ...bus, stage: "guess" } };
  if (action.type === "bus-guess" && bus.stage === "guess") {
    if (action.guess !== "higher" && action.guess !== "lower") return state;
    const route = state.routes[bus.attempt];
    const correct =
      compareCards(route[bus.cursor - 1], route[bus.cursor], action.guess, {
        ace: "high",
        ties: "lose",
      }) === "correct";
    const next = {
      ...bus,
      stage: "feedback" as const,
      correct,
      failures: bus.failures + (correct ? 0 : 1),
    };
    if (correct && bus.cursor === BUS_ROUTE_LENGTH - 1)
      return { ...state, phase: "done", bus: next, endReason: "cleared" };
    if (!correct && bus.attempt === BUS_ATTEMPTS - 1)
      return { ...state, phase: "done", bus: next, endReason: "attempt-limit" };
    return { ...state, bus: next };
  }
  if (
    action.type === "next-stop" &&
    bus.stage === "feedback" &&
    bus.correct === true
  )
    return {
      ...state,
      bus: { ...bus, cursor: bus.cursor + 1, stage: "guess", correct: null },
    };
  if (
    action.type === "retry-bus" &&
    bus.stage === "feedback" &&
    bus.correct === false
  )
    return {
      ...state,
      bus: {
        ...bus,
        attempt: bus.attempt + 1,
        cursor: 1,
        stage: "guess",
        correct: null,
      },
    };
  return state;
}
