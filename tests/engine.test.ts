import { test } from "node:test";
import assert from "node:assert/strict";
import {
  activeFateRules,
  cardDeck,
  compareCards,
  potatoDuration,
  potatoExpired,
  promptDeck,
  shuffle,
  validateNames,
  voteResults,
} from "../shared/engine.ts";
import { prompts } from "../shared/content.ts";
import { games } from "../shared/catalog.ts";

test("a shuffled deck contains all 52 unique cards and four kings", () => {
  const deck = cardDeck();
  assert.equal(deck.length, 52);
  assert.equal(
    new Set(deck.map((card) => `${card.rank}${card.suit}`)).size,
    52,
  );
  assert.equal(deck.filter((card) => card.rank === 13).length, 4);
  assert.equal(deck.filter((card) => card.rank === 1).length, 4);
});
test("higher/lower handles ties, aces and both directions", () => {
  const card = (rank: number) => ({ rank, suit: "♥" as const });
  assert.equal(compareCards(card(1), card(13), "higher"), "correct");
  assert.equal(compareCards(card(13), card(1), "higher"), "wrong");
  assert.equal(compareCards(card(13), card(1), "lower"), "correct");
  assert.equal(compareCards(card(1), card(13), "lower"), "wrong");
  assert.equal(compareCards(card(6), card(6), "higher"), "tie");
  assert.equal(compareCards(card(6), card(6), "lower"), "tie");
});
test("all question games have 36 unique authored prompts, 12 per category", () => {
  const ids: string[] = [];
  for (const game of ["truth", "never", "most-likely"] as const) {
    assert.equal(prompts[game].length, 36);
    const deck = promptDeck(game);
    assert.equal(new Set(deck.map((prompt) => prompt.id)).size, 36);
    for (const category of ["vors", "hytta", "venner"] as const) {
      const filtered = promptDeck(game, category);
      assert.equal(filtered.length, 12);
      assert.ok(filtered.every((prompt) => prompt.category === category));
    }
    ids.push(...deck.map((prompt) => prompt.id));
  }
  assert.equal(new Set(ids).size, 108);
});
test("shuffle never mutates its input and retains its items", () => {
  const input = Object.freeze([1, 2, 3, 4]);
  assert.deepEqual(
    shuffle(input, () => 0),
    [2, 3, 4, 1],
  );
  assert.deepEqual(input, [1, 2, 3, 4]);
});
test("party validation rejects duplicate, empty, long and out-of-range names", () => {
  assert.equal(validateNames(["Emil", "Ada"], 2), null);
  for (const names of [
    ["Emil"],
    ["Emil", " emil "],
    ["Emil", ""],
    ["Emil", "a".repeat(25)],
    Array.from({ length: 17 }, (_, i) => String(i)),
  ])
    assert.ok(validateNames(names, 2));
});
test("ballot results include tied winners and ignore forged voters and targets", () => {
  const players = [
    { id: "a", name: "Ada" },
    { id: "b", name: "Emil" },
    { id: "c", name: "Siri" },
  ];
  const result = voteResults(players, {
    a: "b",
    b: "a",
    c: "invalid",
    intruder: "a",
  });
  assert.deepEqual(result.counts, { a: 1, b: 1, c: 0 });
  assert.deepEqual(
    result.winners.map((player) => player.id),
    ["a", "b"],
  );
  assert.deepEqual(voteResults(players, {}).winners, []);
});
test("potato has a bounded hidden duration and uses an absolute deadline", () => {
  assert.equal(
    potatoDuration(() => 0),
    15_000,
  );
  assert.equal(
    potatoDuration(() => 0.999999),
    45_000,
  );
  assert.equal(potatoExpired(20_000, 19_999), false);
  assert.equal(potatoExpired(20_000, 20_000), true);
  assert.equal(potatoExpired(20_000, 1_000_000), true);
});
test("the latest jack/queen replaces the previous master", () => {
  const player = (name: string) => ({ name, id: name });
  const effect = (rank: number, name: string) => ({
    card: { rank, suit: "♠" as const },
    player: player(name),
  });
  assert.deepEqual(
    activeFateRules([
      effect(11, "Ada"),
      effect(12, "Emil"),
      effect(11, "Siri"),
    ]),
    ["Tommelmester: Siri", "Spørsmålsmester: Emil"],
  );
});
test("catalog preserves the MVP and all implemented local games", () => {
  assert.equal(games.length, 17);
  assert.equal(new Set(games.map((game) => game.id)).size, 17);
  assert.equal(games.filter((game) => game.kind === "live").length, 1);
  for (const id of [
    "roulette",
    "truth",
    "never",
    "higher-lower",
    "most-likely",
    "hot-potato",
    "fate",
    "live",
    "sip-dare",
    "bottle",
    "box",
    "quickfire",
    "showdown",
    "emoji",
    "category-rush",
    "truth-train",
    "bus",
  ])
    assert.ok(games.some((game) => game.id === id));
  assert.ok(
    games.every((game) => game.rules.length && game.min >= 1 && game.min <= 16),
  );
});
