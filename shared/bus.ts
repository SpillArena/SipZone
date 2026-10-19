import {
  cardDeck,
  compareCards,
  validateNames,
  type Card,
  type Player,
  type Suit,
} from "./engine.ts";
export const BUS_MAX_PLAYERS = 8;
export const H_CARD_COUNT = 12;
export const PYRAMID_CARD_COUNT = 15;
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
/** Pyramid indices run from the five-card bottom row to the single top card. */
export function pyramidRow(index: number) {
  if (!Number.isInteger(index) || index < 0 || index >= PYRAMID_CARD_COUNT)
    throw new Error("Ugyldig pyramidekort.");
  return index < 5 ? 1 : index < 9 ? 2 : index < 12 ? 3 : index < 14 ? 4 : 5;
}
export function hEffect(index: number): "give" | "take" | "shot" {
  if (!Number.isInteger(index) || index < 0 || index >= H_CARD_COUNT)
    throw new Error("Ugyldig H-kort.");
  return index >= 10 ? "shot" : index % 2 === 0 ? "take" : "give";
}
export function isPictureCard(card: Card) {
  return card.rank >= 11 && card.rank <= 13;
}
export function pyramidPenalty(row: number): { sips: number; shot: boolean } {
  if (!Number.isInteger(row) || row < 1 || row > 5)
    throw new Error("Ugyldig pyramiderad.");
  return { sips: row === 5 ? 0 : row * 2, shot: row === 5 };
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
  h: Card[];
  guessHands: Card[][];
  pyramid: Card[];
  phase: "deal" | "h" | "driver" | "bus" | "done";
  deal: {
    player: number;
    question: number;
    stage: "handoff" | "guess" | "feedback";
    correct: boolean | null;
    recipient: number | null;
  };
  table: {
    index: number;
    stage: "intro" | "covered" | "open" | "handoff" | "hand" | "award";
    viewer: number | null;
    played: Card | null;
    recipient: number | null;
    actor: number | null;
  };
  driverCandidates: number[];
  drivers: number[];
  bus: {
    attempt: number;
    row: number;
    stage: "ready" | "pick" | "feedback";
    picks: number[];
    failed: boolean;
    failures: number;
  };
  endReason: "no-driver" | "cleared" | "skipped" | null;
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
  const guesses = cardDeck(random);
  return {
    players: players.map((player) => ({ ...player })),
    hands: players.map((_, index) => deck.slice(index * 4, index * 4 + 4)),
    guessHands: players.map((_, index) =>
      guesses.slice(index * 4, index * 4 + 4),
    ),
    h: deck.slice(players.length * 4, players.length * 4 + H_CARD_COUNT),
    pyramid: cardDeck(random).slice(0, PYRAMID_CARD_COUNT),
    phase: "h",
    deal: {
      player: 0,
      question: 0,
      stage: "handoff",
      correct: null,
      recipient: null,
    },
    table: {
      index: -1,
      stage: "intro",
      viewer: null,
      played: null,
      recipient: null,
      actor: null,
    },
    driverCandidates: [],
    drivers: [],
    bus: {
      attempt: 1,
      row: 1,
      stage: "ready",
      picks: [],
      failed: false,
      failures: 0,
    },
    endReason: null,
  };
}
export type BusAction =
  | { type: "confirm-deal" }
  | { type: "deal-guess"; guess: BusGuess }
  | { type: "deal-award"; recipient: number }
  | { type: "next-player" }
  | { type: "start-h" }
  | { type: "reveal-h" }
  | { type: "view-hand"; player: number }
  | { type: "confirm-hand" }
  | { type: "close-hand" }
  | { type: "play-card"; slot: number }
  | { type: "award"; recipient: number }
  | { type: "next-h" }
  | { type: "choose-driver"; player: number }
  | { type: "ride-together" }
  | { type: "start-bus" }
  | { type: "pick-pyramid"; index: number }
  | { type: "next-row" }
  | { type: "retry-bus" }
  | { type: "skip-bus" };
function finishH(state: BusState): BusState {
  const candidates = busCandidates(state.hands);
  return {
    ...state,
    phase: !candidates.length
      ? "done"
      : candidates.length === 1
        ? "deal"
        : "driver",
    endReason: !candidates.length ? "no-driver" : null,
    driverCandidates: candidates,
    drivers: candidates.length === 1 ? candidates : [],
    deal: { ...state.deal, player: candidates[0] ?? 0 },
  };
}
/** Gate every action by phase and reveal state; repeated taps cannot consume cards. */
export function playBus(
  state: BusState,
  action: BusAction,
  random = Math.random,
): BusState {
  const { deal, table, bus } = state;
  const validRecipient = (index: number, actor: number) =>
    Number.isInteger(index) && !!state.players[index] && index !== actor;
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
      return {
        ...state,
        deal: {
          ...deal,
          stage: "feedback",
          correct: busGuessCorrect(
            state.guessHands[deal.player],
            deal.question,
            action.guess,
          ),
        },
      };
    }
    if (
      action.type === "deal-award" &&
      deal.stage === "feedback" &&
      deal.correct &&
      deal.recipient === null &&
      validRecipient(action.recipient, deal.player)
    )
      return { ...state, deal: { ...deal, recipient: action.recipient } };
    if (
      action.type === "next-player" &&
      deal.stage === "feedback" &&
      (!deal.correct || deal.recipient !== null)
    ) {
      const next =
        (state.drivers.indexOf(deal.player) + 1) % state.drivers.length;
      const player = state.drivers[next];
      const question = deal.question + (next === 0 ? 1 : 0);
      if (question === 4) return { ...state, phase: "bus" };
      return {
        ...state,
        deal: {
          player,
          question,
          stage: "handoff",
          correct: null,
          recipient: null,
        },
      };
    }
    return state;
  }
  if (state.phase === "h") {
    if (action.type === "start-h" && table.stage === "intro")
      return { ...state, table: { ...table, index: 0, stage: "covered" } };
    if (action.type === "reveal-h" && table.stage === "covered")
      return { ...state, table: { ...table, stage: "open" } };
    if (
      action.type === "view-hand" &&
      (table.stage === "intro" || table.stage === "open") &&
      Number.isInteger(action.player) &&
      state.hands[action.player]?.length
    )
      return {
        ...state,
        table: { ...table, stage: "handoff", viewer: action.player },
      };
    if (action.type === "confirm-hand" && table.stage === "handoff")
      return { ...state, table: { ...table, stage: "hand" } };
    if (
      action.type === "close-hand" &&
      (table.stage === "hand" || table.stage === "handoff")
    )
      return {
        ...state,
        table: {
          ...table,
          stage: table.index < 0 ? "intro" : "open",
          viewer: null,
        },
      };
    if (
      action.type === "play-card" &&
      table.stage === "hand" &&
      table.viewer !== null &&
      table.index >= 0 &&
      Number.isInteger(action.slot)
    ) {
      const card = state.hands[table.viewer][action.slot];
      if (!card || card.rank !== state.h[table.index].rank) return state;
      const give = hEffect(table.index) === "give";
      return {
        ...state,
        hands: state.hands.map((hand, index) =>
          index === table.viewer
            ? hand.filter((_, slot) => slot !== action.slot)
            : hand,
        ),
        table: {
          ...table,
          stage: give ? "award" : "open",
          played: card,
          actor: table.viewer,
          recipient: give ? null : table.viewer,
          viewer: give ? table.viewer : null,
        },
      };
    }
    if (
      action.type === "award" &&
      table.stage === "award" &&
      table.viewer !== null &&
      validRecipient(action.recipient, table.viewer)
    )
      return {
        ...state,
        table: {
          ...table,
          stage: "open",
          recipient: action.recipient,
          viewer: null,
        },
      };
    if (action.type === "next-h" && table.stage === "open") {
      // Reveal the entire H even if everyone has already emptied their hands.
      if (table.index === H_CARD_COUNT - 1) return finishH(state);
      return {
        ...state,
        table: {
          index: table.index + 1,
          stage: "covered",
          viewer: null,
          played: null,
          actor: null,
          recipient: null,
        },
      };
    }
    return state;
  }
  if (state.phase === "driver") {
    if (action.type === "ride-together")
      return {
        ...state,
        phase: "deal",
        drivers: [...state.driverCandidates],
        deal: { ...deal, player: state.driverCandidates[0] },
      };
    if (
      action.type === "choose-driver" &&
      state.driverCandidates.includes(action.player)
    )
      return {
        ...state,
        phase: "deal",
        drivers: [action.player],
        deal: { ...deal, player: action.player },
      };
    return state;
  }
  if (action.type === "skip-bus")
    return { ...state, phase: "done", endReason: "skipped" };
  if (action.type === "start-bus" && bus.stage === "ready")
    return { ...state, bus: { ...bus, stage: "pick" } };
  if (
    action.type === "pick-pyramid" &&
    bus.stage === "pick" &&
    Number.isInteger(action.index) &&
    action.index >= 0 &&
    action.index < PYRAMID_CARD_COUNT &&
    pyramidRow(action.index) === bus.row
  ) {
    const failed = isPictureCard(state.pyramid[action.index]);
    const next = {
      ...bus,
      stage: "feedback" as const,
      picks: [...bus.picks, action.index],
      failed,
      failures: bus.failures + (failed ? 1 : 0),
    };
    return {
      ...state,
      bus: next,
      phase: !failed && bus.row === 5 ? "done" : "bus",
      endReason: !failed && bus.row === 5 ? "cleared" : null,
    };
  }
  if (
    action.type === "next-row" &&
    bus.stage === "feedback" &&
    !bus.failed &&
    bus.row < 5
  )
    return { ...state, bus: { ...bus, row: bus.row + 1, stage: "pick" } };
  if (action.type === "retry-bus" && bus.stage === "feedback" && bus.failed)
    return {
      ...state,
      pyramid: cardDeck(random).slice(0, PYRAMID_CARD_COUNT),
      bus: {
        ...bus,
        attempt: bus.attempt + 1,
        row: 1,
        stage: "pick",
        picks: [],
        failed: false,
      },
    };
  return state;
}
