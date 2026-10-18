import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bracketStage,
  bottleRotation,
  darePool,
  matchesAnswer,
  quizStandings,
  secondsLeft,
  timedAnswer,
} from "../shared/party-engine.ts";
import {
  bottleQuestions,
  boxTasks,
  dares,
  emojiPuzzles,
  quickQuestions,
  rushCategories,
  showdownTasks,
  trainQuestions,
} from "../shared/party-content.ts";

test("dare categories and levels have nonrepeating content for every setup choice", () => {
  assert.equal(dares.length, 48);
  for (const level of ["easy", "bold"] as const) {
    assert.equal(darePool("all", level).length, 24);
    for (const category of ["vors", "hytta", "venner"] as const) {
      const pool = darePool(category, level);
      assert.equal(pool.length, 8);
      assert.ok(
        pool.every(
          (item) => item.level === level && item.category === category,
        ),
      );
      assert.equal(new Set(pool.map((item) => item.text)).size, pool.length);
    }
  }
});
test("quiz bank has valid, unique questions and one unambiguous answer per question", () => {
  assert.ok(quickQuestions.length >= 20);
  assert.equal(
    new Set(quickQuestions.map((item) => item.question)).size,
    quickQuestions.length,
  );
  for (const item of quickQuestions) {
    assert.equal(item.choices.length, 4);
    assert.equal(new Set(item.choices).size, 4);
    assert.ok(
      Number.isInteger(item.answer) && item.answer >= 0 && item.answer < 4,
    );
  }
});
test("authored decks cover a full 20-round session without repeated tasks", () => {
  for (const deck of [
    bottleQuestions,
    boxTasks,
    emojiPuzzles.map((item) => item.emoji),
    rushCategories,
    trainQuestions.map((item) => item[0]),
  ]) {
    assert.ok(deck.length >= 20);
    assert.equal(new Set(deck).size, deck.length);
  }
  assert.ok(showdownTasks.length >= 15); // Maximum of 15 duels for 16 players.
});
test("emoji answers handle Norwegian characters, punctuation, spacing and aliases without accepting blanks or partial matches", () => {
  assert.equal(matchesAnswer("  LØVENES   KONGE! ", ["Løvenes konge"]), true);
  assert.equal(matchesAnswer("spider man", ["Spider-Man"]), true);
  assert.equal(matchesAnswer("palse i lompe", ["Pølse i lompe"]), false);
  assert.equal(matchesAnswer("17 mai", ["17. mai"]), true);
  assert.equal(matchesAnswer("ærlig", ["aerlig"]), true);
  assert.equal(matchesAnswer("poelse", ["pølse"]), false);
  assert.equal(matchesAnswer("...", [""]), false);
  assert.equal(matchesAnswer("King", ["Lion King"]), false);
  for (const puzzle of emojiPuzzles) {
    assert.equal(
      matchesAnswer(puzzle.answer, [puzzle.answer, ...(puzzle.aliases ?? [])]),
      true,
    );
    for (const alias of puzzle.aliases ?? [])
      assert.equal(
        matchesAnswer(alias, [puzzle.answer, ...puzzle.aliases!]),
        true,
      );
  }
});
test("timer expires at the exact deadline, rejects late correct answers and clamps background time", () => {
  assert.equal(timedAnswer(10000, true, 9999), "correct");
  assert.equal(timedAnswer(10000, false, 9999), "wrong");
  assert.equal(timedAnswer(10000, true, 10000), "timeout");
  assert.equal(timedAnswer(10000, true, 90000), "timeout");
  assert.equal(secondsLeft(10000, 8999), 2);
  assert.equal(secondsLeft(10000, 10000), 0);
  assert.equal(secondsLeft(10000, 90000), 0);
});
test("quiz points and streaks follow individual players across turns and timeouts reset only that player", () => {
  assert.deepEqual(
    quizStandings([
      { playerId: "a", outcome: "correct" },
      { playerId: "b", outcome: "correct" },
      { playerId: "a", outcome: "correct" },
      { playerId: "b", outcome: "wrong" },
      { playerId: "a", outcome: "timeout" },
      { playerId: "b", outcome: "correct" },
    ]),
    { scores: { a: 2, b: 2 }, streaks: { a: 0, b: 1 } },
  );
});
test("bottle points to the selected seat after at least four revolutions, including repeat selections", () => {
  for (let seats = 2; seats <= 16; seats++) {
    let angle = 0;
    for (let seat = 0; seat < seats; seat++) {
      const next = bottleRotation(angle, seat, seats);
      assert.ok(next - angle >= 1440);
      assert.ok(
        Math.abs((((next % 360) + 360) % 360) - (seat / seats) * 360) <
          0.000001,
      );
      const repeat = bottleRotation(next, seat, seats);
      assert.ok(Math.abs(repeat - next - 1440) < 0.000001);
      angle = next;
    }
  }
});
test("every 2–16 player tournament ends with one champion after n−1 duels, with no self-match or lost bye", () => {
  for (let size = 2; size <= 16; size++) {
    let field = Array.from({ length: size }, (_, i) => ({
      id: String(i),
      name: `Player ${i}`,
    }));
    let duels = 0;
    while (field.length > 1) {
      const stage = bracketStage(field);
      const represented = [
        ...stage.matches.flatMap((match) => [match.first.id, match.second.id]),
        ...stage.byes.map((p) => p.id),
      ];
      assert.equal(new Set(represented).size, field.length);
      assert.deepEqual([...represented].sort(), field.map((p) => p.id).sort());
      for (const match of stage.matches)
        assert.notEqual(match.first.id, match.second.id);
      duels += stage.matches.length;
      field = [...stage.matches.map((match) => match.first), ...stage.byes];
    }
    assert.equal(field.length, 1);
    assert.equal(duels, size - 1);
  }
});
