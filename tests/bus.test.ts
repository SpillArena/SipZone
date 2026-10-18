import { test } from "node:test";
import assert from "node:assert/strict";
import { cardDeck, validateNames, type Card } from "../shared/engine.ts";
import {
  BUS_MAX_PLAYERS,
  busCandidates,
  busGuessCorrect,
  createBusGame,
  playBus,
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
  actions.reduce(playBus, state);
function finishDeal(size = 3) {
  let state = createBusGame(players.slice(0, size), () => 0);
  for (let i = 0; i < size; i++) {
    state = playBus(state, { type: "confirm-deal" });
    for (const guess of ["red", "higher", "inside", "♠"] as const)
      state = action(
        state,
        { type: "deal-guess", guess },
        { type: "next-question" },
      );
    state = playBus(state, { type: "hide-hand" });
  }
  return state;
}
function busState(): BusState {
  const base = finishDeal();
  return {
    ...base,
    phase: "bus",
    driver: 0,
    routes: [
      [c(2), c(3), c(4), c(5), c(6)],
      [c(8), c(8, "♥"), c(2), c(3), c(4)],
      [c(13), c(1), c(2), c(3), c(4)],
    ],
  };
}
test("one deck fits 2–8 players with four unique cards each and a 15-card pyramid", () => {
  for (let size = 2; size <= BUS_MAX_PLAYERS; size++) {
    const state = createBusGame(players.slice(0, size));
    const dealt = [...state.hands.flat(), ...state.pyramid];
    assert.equal(dealt.length, 4 * size + 15);
    assert.equal(
      new Set(dealt.map((card) => `${card.rank}${card.suit}`)).size,
      dealt.length,
    );
    assert.ok(dealt.length <= 52);
    for (const route of state.routes) {
      assert.equal(route.length, 5);
      assert.equal(
        new Set(route.map((card) => `${card.rank}${card.suit}`)).size,
        5,
      );
    }
  }
  assert.throws(() => createBusGame(players.slice(0, 1)));
  assert.throws(() => createBusGame([...players, { id: "9", name: "Nine" }]));
  assert.ok(validateNames([...players.map((p) => p.name), "Nine"], 2, 8));
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
test("dealing requires handoff, valid choice, feedback and hidden memory hand before advancing", () => {
  let state = createBusGame(players.slice(0, 2), () => 0);
  assert.strictEqual(
    playBus(state, { type: "deal-guess", guess: "black" }),
    state,
  );
  state = playBus(state, { type: "confirm-deal" });
  assert.strictEqual(playBus(state, { type: "hide-hand" }), state);
  assert.strictEqual(
    playBus(state, { type: "deal-guess", guess: "inside" }),
    state,
  );
  state = playBus(state, { type: "deal-guess", guess: "black" });
  assert.equal(state.scores[0], 1);
  assert.strictEqual(
    playBus(state, { type: "deal-guess", guess: "black" }),
    state,
  );
  assert.strictEqual(playBus(state, { type: "hide-hand" }), state);
  const complete = finishDeal(2);
  assert.equal(complete.phase, "pyramid");
  assert.equal(complete.table.stage, "intro");
  assert.equal(complete.hands[0].length, 4);
});
test("pyramid rows cover exactly 5/4/3/2/1 cards and invalid indices are rejected", () => {
  assert.deepEqual(
    Array.from({ length: 15 }, (_, i) => pyramidRow(i)),
    [1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 4, 4, 5],
  );
  for (const index of [-1, 15, 0.5, NaN])
    assert.throws(() => pyramidRow(index));
});
test("pyramid hands stay gated, mismatches do not play, and each matching card scores once", () => {
  let state = finishDeal();
  const match = state.hands[0][0];
  state = {
    ...state,
    pyramid: [{ ...match, suit: "♦" }, ...state.pyramid.slice(1)],
  };
  state = action(state, { type: "start-pyramid" }, { type: "reveal-pyramid" });
  assert.strictEqual(playBus(state, { type: "play-card", slot: 0 }), state);
  assert.strictEqual(playBus(state, { type: "view-hand", player: -1 }), state);
  state = playBus(state, { type: "view-hand", player: 0 });
  assert.equal(state.table.stage, "handoff");
  assert.strictEqual(playBus(state, { type: "play-card", slot: 0 }), state);
  state = playBus(state, { type: "confirm-hand" });
  assert.strictEqual(playBus(state, { type: "play-card", slot: 1 }), state);
  const score = state.scores[0];
  state = playBus(state, { type: "play-card", slot: 0 });
  assert.equal(state.hands[0].length, 3);
  assert.equal(state.scores[0], score + 1);
  assert.equal(state.table.stage, "award");
  assert.strictEqual(playBus(state, { type: "play-card", slot: 0 }), state);
  assert.strictEqual(playBus(state, { type: "award", recipient: 0 }), state);
  assert.strictEqual(playBus(state, { type: "award", recipient: 99 }), state);
  state = playBus(state, { type: "award", recipient: 1 });
  assert.equal(state.table.stage, "open");
  assert.equal(state.table.viewer, null);
  assert.equal(state.table.recipient, 1);
  state = playBus(state, { type: "next-pyramid" });
  assert.equal(state.table.stage, "covered");
  assert.equal(state.table.index, 1);
  assert.strictEqual(playBus(state, { type: "next-pyramid" }), state);
});
test("all 15 pyramid cards are revealed in order, including the last top card", () => {
  let state = action(finishDeal(8), { type: "start-pyramid" });
  for (let i = 0; i < 15; i++) {
    assert.equal(state.table.index, i);
    state = action(state, { type: "reveal-pyramid" }, { type: "next-pyramid" });
  }
  assert.equal(state.phase, "driver");
  assert.equal(state.driverCandidates.length, 8);
  state = playBus(state, { type: "draw-driver" });
  assert.equal(state.phase, "bus");
  assert.ok(state.driverCandidates.includes(state.driver!));
});
test("driver is determined by remaining cards, with unique, tied and all-empty outcomes", () => {
  assert.deepEqual(busCandidates([[c(2)], [c(3), c(4)], [c(5), c(6)]]), [1, 2]);
  assert.deepEqual(busCandidates([[], []]), []);
  const base = finishDeal();
  const final = {
    ...base,
    table: { ...base.table, index: 14, stage: "open" as const },
  };
  const unique = playBus(
    { ...final, hands: [[c(2)], [], []] },
    { type: "next-pyramid" },
  );
  assert.equal(unique.phase, "bus");
  assert.equal(unique.driver, 0);
  const empty = playBus(
    { ...final, hands: [[], [], []] },
    { type: "next-pyramid" },
  );
  assert.equal(empty.phase, "done");
  assert.equal(empty.endReason, "no-driver");
  const tied = playBus(
    { ...final, hands: [[c(2)], [c(3)], []], driverLot: 0.999 },
    { type: "next-pyramid" },
  );
  assert.equal(tied.phase, "driver");
  assert.equal(playBus(tied, { type: "draw-driver" }).driver, 1);
});
test("bus victory takes four correct guesses, cannot double-consume feedback and never overruns the route", () => {
  let state = playBus(busState(), { type: "start-bus" });
  for (let i = 1; i <= 4; i++) {
    assert.equal(state.bus.cursor, i);
    state = playBus(state, { type: "bus-guess", guess: "higher" });
    assert.strictEqual(
      playBus(state, { type: "bus-guess", guess: "higher" }),
      state,
    );
    if (i < 4) state = playBus(state, { type: "next-stop" });
  }
  assert.equal(state.phase, "done");
  assert.equal(state.endReason, "cleared");
  assert.equal(state.bus.failures, 0);
  assert.strictEqual(playBus(state, { type: "retry-bus" }), state);
});
test("misses and equal ranks restart from the next prepared route and stop after three failures", () => {
  let state = playBus(busState(), { type: "start-bus" });
  state = playBus(state, { type: "bus-guess", guess: "lower" });
  assert.equal(state.bus.failures, 1);
  assert.strictEqual(playBus(state, { type: "next-stop" }), state);
  state = playBus(state, { type: "retry-bus" });
  assert.equal(state.bus.attempt, 1);
  assert.equal(state.bus.cursor, 1);
  state = playBus(state, { type: "bus-guess", guess: "higher" });
  assert.equal(state.bus.correct, false);
  assert.equal(state.bus.failures, 2);
  state = playBus(state, { type: "retry-bus" });
  assert.equal(state.bus.attempt, 2);
  assert.equal(state.routes[2][1].rank, 1);
  state = playBus(state, { type: "bus-guess", guess: "lower" });
  assert.equal(state.phase, "done");
  assert.equal(state.endReason, "attempt-limit");
  assert.equal(state.bus.failures, 3);
  assert.strictEqual(playBus(state, { type: "retry-bus" }), state);
});
test("the driver can end the bus ride at any stage without another failure or changing scores", () => {
  for (const stage of ["ready", "guess", "feedback"] as const) {
    const state = busState();
    state.bus.stage = stage;
    const ended = playBus(state, { type: "skip-bus" });
    assert.equal(ended.phase, "done");
    assert.equal(ended.endReason, "skipped");
    assert.equal(ended.bus.failures, 0);
    assert.deepEqual(ended.scores, state.scores);
  }
});
test("several complete random games preserve hand sizes and terminate in a bounded number of actions", () => {
  for (let seed = 1; seed <= 20; seed++) {
    let n = seed;
    const random = () => {
      n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
      return n / 2 ** 32;
    };
    let state = createBusGame(players.slice(0, 2 + (seed % 7)), random);
    let actions = 0;
    while (state.phase !== "done" && actions++ < 300) {
      if (state.phase === "deal") {
        const stage = state.deal.stage;
        state = playBus(
          state,
          stage === "handoff"
            ? { type: "confirm-deal" }
            : stage === "guess"
              ? {
                  type: "deal-guess",
                  guess: ["red", "higher", "inside", "♠"][
                    state.deal.question
                  ] as "red" | "higher" | "inside" | "♠",
                }
              : stage === "feedback"
                ? { type: "next-question" }
                : { type: "hide-hand" },
        );
      } else if (state.phase === "pyramid")
        state = playBus(
          state,
          state.table.stage === "intro"
            ? { type: "start-pyramid" }
            : state.table.stage === "covered"
              ? { type: "reveal-pyramid" }
              : { type: "next-pyramid" },
        );
      else if (state.phase === "driver")
        state = playBus(state, { type: "draw-driver" });
      else
        state = playBus(
          state,
          state.bus.stage === "ready"
            ? { type: "start-bus" }
            : state.bus.stage === "guess"
              ? { type: "bus-guess", guess: "higher" }
              : state.bus.correct
                ? { type: "next-stop" }
                : { type: "retry-bus" },
        );
      assert.ok(state.hands.every((hand) => hand.length <= 4));
      assert.ok(state.bus.attempt < 3);
      assert.ok(state.bus.cursor < 5);
    }
    assert.equal(state.phase, "done");
    assert.ok(actions < 300);
  }
  assert.equal(cardDeck().length, 52);
});
