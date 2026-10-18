import { test } from "node:test";
import assert from "node:assert/strict";
import { compareCards, type Card } from "../shared/engine.ts";
import {
  initialHigherLower,
  playHigherLower,
  type HigherLowerAction,
  type HigherLowerOptions,
  type HigherLowerState,
} from "../shared/higher-lower.ts";
import {
  chooseFatePartner,
  fatePartnerPairs,
} from "../shared/fate-partners.ts";
const card = (rank: number): Card => ({ rank, suit: "♠" });
const options: HigherLowerOptions = {
  mode: "streak",
  ace: "low",
  ties: "safe",
  rounds: 5,
};
const players = [
  { id: "a", name: "Ada" },
  { id: "b", name: "Emil" },
  { id: "c", name: "Siri" },
  { id: "d", name: "Per" },
];
const ids = players.map((p) => p.id);
function run(
  ranks: number[],
  actions: HigherLowerAction[],
  rules = options,
  initial: HigherLowerState = initialHigherLower(),
) {
  return actions.reduce(
    (state, action) =>
      playHigherLower(state, action, ranks.map(card), ids, rules),
    initial,
  );
}
test("ace and equality follow the selected house rules in both directions", () => {
  assert.equal(
    compareCards(card(13), card(1), "higher", { ace: "high", ties: "safe" }),
    "correct",
  );
  assert.equal(
    compareCards(card(1), card(2), "higher", { ace: "high", ties: "safe" }),
    "wrong",
  );
  assert.equal(
    compareCards(card(1), card(13), "lower", { ace: "high", ties: "lose" }),
    "correct",
  );
  assert.equal(
    compareCards(card(7), card(7), "lower", { ace: "low", ties: "lose" }),
    "wrong",
  );
  assert.equal(
    compareCards(card(7), card(7), "higher", { ace: "high", ties: "safe" }),
    "tie",
  );
});
test("continuing risks only the unbanked streak and keeps the same player", () => {
  const state = run(
    [2, 4, 6, 3, 8],
    [
      { type: "guess", direction: "higher" },
      { type: "continue" },
      { type: "guess", direction: "higher" },
      { type: "continue" },
      { type: "guess", direction: "higher" },
    ],
  );
  assert.equal(state.turn, 0);
  assert.equal(state.cursor, 3);
  assert.equal(state.result, "wrong");
  assert.equal(state.pending, 0);
  assert.equal(state.scores.a ?? 0, 0);
});
test("banking is applied once and player handoff consumes the next unique card", () => {
  let state = run(
    [2, 4, 6, 9, 3],
    [{ type: "guess", direction: "higher" }, { type: "bank" }],
  );
  assert.equal(state.secured, 1);
  assert.equal(state.scores.a, 1);
  assert.equal(state.pending, 0);
  assert.strictEqual(
    run([2, 4, 6, 9, 3], [{ type: "bank" }], options, state),
    state,
  );
  state = run(
    [2, 4, 6, 9, 3],
    [{ type: "next" }, { type: "guess", direction: "lower" }],
    options,
    state,
  );
  assert.equal(state.turn, 1);
  assert.equal(state.cursor, 2);
  assert.equal(state.result, "wrong");
  assert.equal(state.scores.a, 1);
  assert.equal(state.scores.b ?? 0, 0);
});
test("safe ties retain a streak without adding points; losing ties discard it", () => {
  const actions: HigherLowerAction[] = [
    { type: "guess", direction: "higher" },
    { type: "continue" },
    { type: "guess", direction: "higher" },
  ];
  const safe = run([2, 4, 4, 8], actions);
  assert.equal(safe.result, "tie");
  assert.equal(safe.pending, 1);
  const lose = run([2, 4, 4, 8], actions, { ...options, ties: "lose" });
  assert.equal(lose.result, "wrong");
  assert.equal(lose.pending, 0);
});
test("the final card banks an unbeaten streak, including a safe tie, and finishes without overdraw", () => {
  for (const finalRank of [4, 7]) {
    const state = run(
      [2, 4, finalRank],
      [
        { type: "guess", direction: "higher" },
        { type: "continue" },
        { type: "guess", direction: "higher" },
      ],
    );
    assert.equal(state.pending, 0);
    assert.equal(state.scores.a, finalRank === 4 ? 1 : 2);
    assert.strictEqual(
      run([2, 4, finalRank], [{ type: "continue" }], options, state),
      state,
    );
    const ended = run([2, 4, finalRank], [{ type: "next" }], options, state);
    assert.equal(ended.finished, true);
    assert.equal(ended.cursor, 2);
    assert.strictEqual(
      run(
        [2, 4, finalRank],
        [{ type: "guess", direction: "higher" }],
        options,
        ended,
      ),
      ended,
    );
  }
});
test("quick mode keeps one guess per turn and round limits do not cut a live streak short", () => {
  const quick = run([2, 4, 6], [{ type: "guess", direction: "higher" }], {
    ...options,
    mode: "quick",
  });
  assert.equal(quick.scores.a, 1);
  assert.equal(quick.pending, 0);
  assert.strictEqual(
    run(
      [2, 4, 6],
      [{ type: "guess", direction: "higher" }],
      { ...options, mode: "quick" },
      quick,
    ),
    quick,
  );
  const streak = run(
    [2, 4, 6, 8],
    [
      { type: "guess", direction: "higher" },
      { type: "next" },
      { type: "continue" },
      { type: "guess", direction: "higher" },
      { type: "bank" },
      { type: "next" },
    ],
    { ...options, rounds: 1 },
  );
  assert.equal(streak.finished, true);
  assert.equal(streak.scores.a, 2);
  assert.equal(streak.turn, 0);
});
test("partner selection is mutual, persists and replacing either partner releases both previous pairs", () => {
  let partners = chooseFatePartner(players, {}, "a", "b");
  assert.deepEqual(partners, { a: "b", b: "a" });
  partners = chooseFatePartner(players, partners, "c", "d");
  assert.equal(fatePartnerPairs(players, partners).length, 2);
  partners = chooseFatePartner(players, partners, "b", "c");
  assert.deepEqual(partners, { b: "c", c: "b" });
  assert.deepEqual(
    fatePartnerPairs(players, partners).map((pair) =>
      pair.map((player) => player.id),
    ),
    [["b", "c"]],
  );
});
test("self selection and unknown partners cannot create or corrupt a pair", () => {
  const partners = chooseFatePartner(players, {}, "a", "b");
  for (const [source, target] of [
    ["a", "a"],
    ["a", "missing"],
    ["missing", "b"],
  ])
    assert.strictEqual(
      chooseFatePartner(players, partners, source, target),
      partners,
    );
  assert.deepEqual(fatePartnerPairs(players, { a: "b" }), []);
});
