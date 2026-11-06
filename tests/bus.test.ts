import { test } from "node:test";
import assert from "node:assert/strict";
import { cardDeck, type Card } from "../shared/engine.ts";
import {
  BUS_MAX_PLAYERS,
  H_CARD_COUNT,
  PYRAMID_CARD_COUNT,
  busCandidates,
  busGuessCorrect,
  createBusGame,
  hEffect,
  isPictureCard,
  playBus,
  pyramidPenalty,
  pyramidRow,
  type BusAction,
  type BusState,
} from "../shared/bus.ts";
const players = Array.from({ length: 8 }, (_, i) => ({
  id: String(i),
  name: `Spiller ${i + 1}`,
}));
const c = (rank: number, suit: Card["suit"] = "♠"): Card => ({ rank, suit });
const action = (state: BusState, ...actions: BusAction[]) =>
  actions.reduce((current, next) => playBus(current, next), state);
function hState(size = 3): BusState {
  let state = createBusGame(players.slice(0, size), () => 0);
  while (state.phase === "deal") {
    state = playBus(state, { type: "confirm-deal" });
    const player = state.deal.player;
    const guess = ["red", "higher", "inside", "♠"][state.deal.question] as
      "red" | "higher" | "inside" | "♠";
    state = playBus(state, { type: "deal-guess", guess });
    if (state.deal.correct)
      state = playBus(state, {
        type: "deal-award",
        recipient: (player + 1) % size,
      });
    state = playBus(state, { type: "next-player" });
  }
  assert.deepEqual(state.hands, state.guessHands);
  return state;
}
function guessState(): BusState {
  return createBusGame(players.slice(0, 3), () => 0);
}
function pyramidState(): BusState {
  return {
    ...guessState(),
    phase: "bus",
    pyramid: Array.from({ length: 15 }, (_, i) => c((i % 10) + 1)),
  };
}
test("four guesses come first and their cards plus 12 H cards fit one deck for 2–8 players", () => {
  for (let size = 2; size <= BUS_MAX_PLAYERS; size++) {
    const state = createBusGame(players.slice(0, size));
    assert.equal(state.phase, "deal");
    assert.equal(state.table.index, -1);
    const dealt = [...state.guessHands.flat(), ...state.h];
    assert.equal(dealt.length, 4 * size + H_CARD_COUNT);
    assert.equal(
      new Set(dealt.map((card) => `${card.rank}${card.suit}`)).size,
      dealt.length,
    );
    assert.equal(state.pyramid.length, PYRAMID_CARD_COUNT);
    assert.ok(state.hands.every((hand) => hand.length === 0));
    assert.ok(state.guessHands.every((hand) => hand.length === 4));
  }
  assert.throws(() => createBusGame(players.slice(0, 1)));
  assert.throws(() => createBusGame([...players, { id: "9", name: "Nine" }]));
  assert.throws(() =>
    createBusGame([
      { id: "x", name: "One" },
      { id: "x", name: "Two" },
    ]),
  );
});
test("all four guess types handle ace-high, strict boundaries, reversed endpoints and colors", () => {
  assert.equal(busGuessCorrect([c(1, "♥")], 0, "red"), true);
  assert.equal(busGuessCorrect([c(1, "♣")], 0, "black"), true);
  assert.equal(busGuessCorrect([c(13), c(1)], 1, "higher"), true);
  assert.equal(busGuessCorrect([c(7), c(7, "♥")], 1, "higher"), false);
  assert.equal(busGuessCorrect([c(10), c(2), c(6)], 2, "inside"), true);
  assert.equal(busGuessCorrect([c(2), c(10), c(1)], 2, "outside"), true);
  for (const guess of ["inside", "outside"] as const)
    assert.equal(busGuessCorrect([c(2), c(10), c(10, "♥")], 2, guess), false);
  assert.equal(busGuessCorrect([c(7), c(7, "♥"), c(8)], 2, "outside"), true);
  assert.equal(
    busGuessCorrect([c(7), c(7, "♥"), c(7, "♦")], 2, "outside"),
    false,
  );
  assert.equal(busGuessCorrect([c(2), c(3), c(4), c(5, "♦")], 3, "♦"), true);
  assert.equal(busGuessCorrect([c(2)], 0, "higher"), false);
});

test("H alternates take/give five times, then reveals the two shot connectors", () => {
  assert.deepEqual(
    Array.from({ length: H_CARD_COUNT }, (_, i) => hEffect(i)),
    [
      "take",
      "give",
      "take",
      "give",
      "take",
      "give",
      "take",
      "give",
      "take",
      "give",
      "shot",
      "shot",
    ],
  );
  for (const index of [-1, 12, 0.5, NaN]) assert.throws(() => hEffect(index));
});
test("private hands require confirmation and cannot be played before H starts", () => {
  let state = hState();
  assert.strictEqual(playBus(state, { type: "reveal-h" }), state);
  state = playBus(state, { type: "view-hand", player: 0 });
  assert.equal(state.table.stage, "handoff");
  assert.strictEqual(playBus(state, { type: "play-card", slot: 0 }), state);
  state = playBus(state, { type: "confirm-hand" });
  assert.strictEqual(playBus(state, { type: "play-card", slot: 0 }), state);
  state = playBus(state, { type: "close-hand" });
  assert.equal(state.table.stage, "intro");
  assert.equal(state.table.viewer, null);
});
test("matching on give side removes a card once and requires a valid other recipient", () => {
  let state = hState();
  state = {
    ...state,
    h: state.h.map(() => c(7)),
    hands: [[c(7), c(7, "♥"), c(2)], [c(7, "♦")], [c(3)]],
  };
  state = action(
    state,
    { type: "start-h" },
    { type: "reveal-h" },
    { type: "next-h" },
    { type: "reveal-h" },
  );
  assert.strictEqual(playBus(state, { type: "play-card", slot: 0 }), state);
  state = action(
    state,
    { type: "view-hand", player: 0 },
    { type: "confirm-hand" },
  );
  assert.strictEqual(playBus(state, { type: "play-card", slot: 2 }), state);
  state = playBus(state, { type: "play-card", slot: 0 });
  assert.equal(state.hands[0].length, 2);
  assert.equal(state.table.stage, "award");
  assert.strictEqual(playBus(state, { type: "play-card", slot: 0 }), state);
  for (const recipient of [-1, 0, 99, 1.2])
    assert.strictEqual(playBus(state, { type: "award", recipient }), state);
  state = playBus(state, { type: "award", recipient: 1 });
  assert.equal(state.table.recipient, 1);
  assert.equal(state.table.viewer, null);
  // Same player can place their second matching card; another player can also match.
  state = action(
    state,
    { type: "view-hand", player: 0 },
    { type: "confirm-hand" },
    { type: "play-card", slot: 0 },
    { type: "award", recipient: 2 },
  );
  assert.equal(state.hands[0].length, 1);
  state = action(
    state,
    { type: "view-hand", player: 1 },
    { type: "confirm-hand" },
    { type: "play-card", slot: 0 },
    { type: "award", recipient: 0 },
  );
  assert.equal(state.hands[1].length, 0);
});
test("take and shot sides apply to the player who placed the card", () => {
  for (const index of [0, 10, 11]) {
    let state = hState();
    state = {
      ...state,
      h: state.h.map(() => c(7)),
      hands: [[c(7)], [c(2)], []],
      table: { ...state.table, index, stage: "open" },
    };
    state = action(
      state,
      { type: "view-hand", player: 0 },
      { type: "confirm-hand" },
      { type: "play-card", slot: 0 },
    );
    assert.equal(state.table.stage, "open");
    assert.equal(state.table.actor, 0);
    assert.equal(state.table.recipient, 0);
    assert.equal(state.hands[0].length, 0);
    assert.strictEqual(playBus(state, { type: "award", recipient: 1 }), state);
  }
});
test("all H cards must be uncovered, even if every hand is already empty", () => {
  let state = hState(2);
  state.hands = [[], []];
  state = playBus(state, { type: "start-h" });
  for (let index = 0; index < H_CARD_COUNT; index++) {
    assert.equal(state.phase, "h");
    assert.equal(state.table.index, index);
    assert.strictEqual(playBus(state, { type: "next-h" }), state);
    state = action(state, { type: "reveal-h" }, { type: "next-h" });
  }
  assert.equal(state.phase, "done");
  assert.equal(state.endReason, "no-driver");
});
test("most remaining cards selects the rider, ties allow physical RPS or a shared bus", () => {
  assert.deepEqual(busCandidates([[c(2)], [c(3), c(4)], [c(5), c(6)]]), [1, 2]);
  assert.deepEqual(busCandidates([[], []]), []);
  const base = hState();
  const final = {
    ...base,
    table: { ...base.table, index: 11, stage: "open" as const },
  };
  const unique = playBus(
    { ...final, hands: [[], [c(2)], []] },
    { type: "next-h" },
  );
  assert.equal(unique.phase, "bus");
  assert.deepEqual(unique.drivers, [1]);
  const tied = playBus(
    { ...final, hands: [[c(2)], [], [c(3)]] },
    { type: "next-h" },
  );
  assert.equal(tied.phase, "driver");
  assert.strictEqual(playBus(tied, { type: "choose-driver", player: 1 }), tied);
  assert.deepEqual(
    playBus(tied, { type: "choose-driver", player: 2 }).drivers,
    [2],
  );
  const together = playBus(tied, { type: "ride-together" });
  assert.equal(together.phase, "bus");
  assert.deepEqual(together.drivers, [0, 2]);
});
test("all players guess once per round, retaining exactly those cards for the H", () => {
  let state = guessState();
  for (let question = 0; question < 4; question++)
    for (const player of [0, 1, 2]) {
      assert.equal(state.phase, "deal");
      assert.equal(state.deal.question, question);
      assert.equal(state.deal.player, player);
      assert.equal(state.deal.stage, "handoff");
      assert.strictEqual(
        playBus(state, { type: "deal-guess", guess: "red" }),
        state,
      );
      state = playBus(state, { type: "confirm-deal" });
      state = playBus(state, {
        type: "deal-guess",
        guess: ["red", "higher", "inside", "♠"][question] as
          "red" | "higher" | "inside" | "♠",
      });
      assert.equal(state.hands[player].length, question + 1);
      assert.deepEqual(
        state.hands[player],
        state.guessHands[player].slice(0, question + 1),
      );
      const feedback = state;
      assert.strictEqual(
        playBus(state, { type: "deal-guess", guess: "red" }),
        feedback,
      );
      if (state.deal.correct) {
        assert.strictEqual(playBus(state, { type: "next-player" }), state);
        assert.strictEqual(
          playBus(state, { type: "deal-award", recipient: player }),
          state,
        );
        state = playBus(state, {
          type: "deal-award",
          recipient: (player + 1) % 3,
        });
        assert.strictEqual(
          playBus(state, { type: "deal-award", recipient: 2 }),
          state,
        );
      }
      state = playBus(state, { type: "next-player" });
    }
  assert.equal(state.phase, "h");
  assert.deepEqual(state.hands, state.guessHands);
  assert.deepEqual(state.drivers, []);
  assert.equal(state.table.stage, "intro");
});
test("pyramid rows, penalties and face-card rules cover every row and ace is safe", () => {
  assert.deepEqual(
    Array.from({ length: 15 }, (_, i) => pyramidRow(i)),
    [1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 4, 4, 5],
  );
  assert.deepEqual([1, 2, 3, 4, 5].map(pyramidPenalty), [
    { sips: 2, shot: false },
    { sips: 4, shot: false },
    { sips: 6, shot: false },
    { sips: 8, shot: false },
    { sips: 0, shot: true },
  ]);
  for (let rank = 1; rank <= 13; rank++)
    assert.equal(isPictureCard(c(rank)), rank >= 11);
  for (const invalid of [-1, 15, NaN, 0.1])
    assert.throws(() => pyramidRow(invalid));
  for (const invalid of [0, 6, NaN, 0.1])
    assert.throws(() => pyramidPenalty(invalid));
});
test("pyramid only accepts one tap on the active row and victory requires all five safe rows", () => {
  let state = pyramidState();
  assert.strictEqual(playBus(state, { type: "pick-pyramid", index: 0 }), state);
  state = playBus(state, { type: "start-bus" });
  for (const invalid of [-1, 15, 14, NaN, 0.5])
    assert.strictEqual(
      playBus(state, { type: "pick-pyramid", index: invalid }),
      state,
    );
  for (const index of [4, 7, 10, 13, 14]) {
    state = playBus(state, { type: "pick-pyramid", index });
    assert.strictEqual(playBus(state, { type: "pick-pyramid", index }), state);
    if (index !== 14) state = playBus(state, { type: "next-row" });
  }
  assert.equal(state.phase, "done");
  assert.equal(state.endReason, "cleared");
  assert.deepEqual(state.bus.picks, [4, 7, 10, 13, 14]);
  assert.strictEqual(playBus(state, { type: "retry-bus" }), state);
});
test("face cards on any row reset the entire shuffled pyramid, without a three-attempt cap", () => {
  for (const index of [0, 5, 9, 12, 14]) {
    let state = pyramidState();
    state = {
      ...state,
      bus: {
        ...state.bus,
        row: pyramidRow(index),
        stage: "pick",
        attempt: 8,
        picks: [4, 8].filter((i) => pyramidRow(i) < pyramidRow(index)),
      },
      pyramid: state.pyramid.map((card, i) => (i === index ? c(12) : card)),
    };
    state = playBus(state, { type: "pick-pyramid", index });
    assert.equal(state.bus.failed, true);
    assert.equal(state.bus.failures, 1);
    assert.strictEqual(playBus(state, { type: "next-row" }), state);
    const previous = state.pyramid;
    state = playBus(state, { type: "retry-bus" }, () => 0.5);
    assert.equal(state.bus.row, 1);
    assert.equal(state.bus.attempt, 9);
    assert.equal(state.bus.stage, "pick");
    assert.deepEqual(state.bus.picks, []);
    assert.notDeepEqual(state.pyramid, previous);
    assert.equal(
      new Set(state.pyramid.map((card) => `${card.rank}${card.suit}`)).size,
      15,
    );
  }
});
test("the bus can be ended without extra failures and a finished game ignores all actions", () => {
  for (const stage of ["ready", "pick", "feedback"] as const) {
    const state = pyramidState();
    state.bus.stage = stage;
    const ended = playBus(state, { type: "skip-bus" });
    assert.equal(ended.endReason, "skipped");
    assert.equal(ended.bus.failures, 0);
    assert.strictEqual(playBus(ended, { type: "retry-bus" }), ended);
  }
  assert.equal(cardDeck().length, 52);
});
