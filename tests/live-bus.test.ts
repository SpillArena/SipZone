import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyRoomAction,
  createRoom,
  joinRoom,
  publicRoom,
  type Room,
} from "../shared/rooms.ts";
import { hEffect } from "../shared/bus.ts";
import type { LiveBusView } from "../shared/live-bus.ts";

const seeded =
  (seed = 7) =>
  () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
const setup = (names = ["Emil", "Siri"]) => {
  const room = createRoom("123A", "Ada");
  const host = room.members[0];
  const others = names.map((name) => joinRoom(room, name, ""));
  applyRoomAction(room, host, {
    action: "settings",
    game: "bus",
    category: "all",
    version: room.version,
  });
  applyRoomAction(
    room,
    host,
    { action: "start", version: room.version },
    Date.now(),
    seeded(),
  );
  return { room, host, others };
};
const view = (room: Room, id: string) =>
  publicRoom(room, id).live as LiveBusView;
const move = (
  room: Room,
  member: Room["members"][number],
  input: Record<string, unknown>,
) =>
  applyRoomAction(room, member, {
    action: "bus",
    version: room.version,
    ...input,
  });

test("every phone gets its own hand and nothing else face down", () => {
  const { room, host, others } = setup();
  const mine = view(room, host.id);
  const theirs = view(room, others[0].id);
  assert.equal(mine.kind, "bus");
  assert.equal(mine.hand.length, 4);
  assert.deepEqual(mine.hand, room.bus!.hands[0]);
  assert.deepEqual(theirs.hand, room.bus!.hands[1]);
  // nobody's payload carries another player's cards, the H or the pyramid
  const sent = JSON.stringify(publicRoom(room, host.id));
  for (const card of [...room.bus!.hands[1], ...room.bus!.hands[2]])
    assert.ok(!sent.includes(JSON.stringify(card)), "another hand leaked");
  assert.ok(mine.h.every((card) => card === null));
  assert.ok(mine.bus.pyramid.every((card) => card === null));
  assert.ok(!sent.includes('"hands"'));
  assert.deepEqual(
    mine.players.map((player) => player.cards),
    [4, 4, 4],
  );
});

test("only the host paces the H, and a stale revision is refused", () => {
  const { room, host, others } = setup();
  assert.throws(
    () => move(room, others[0], { move: "start-h" }),
    /Bare verten/,
  );
  assert.throws(
    () =>
      applyRoomAction(room, host, {
        action: "bus",
        move: "start-h",
        version: room.version - 1,
      }),
    /endret/,
  );
  move(room, host, { move: "start-h" });
  assert.equal(view(room, host.id).hStage, "covered");
  assert.equal(view(room, host.id).h[0], null);
  move(room, host, { move: "reveal-h" });
  assert.deepEqual(view(room, others[1].id).h[0], room.bus!.h[0]);
});

test("players lay matching cards from their own phone, once each", () => {
  const { room, host, others } = setup();
  move(room, host, { move: "start-h" });
  // the first H card is a "take" card; give the second player a match
  const target = room.bus!.h[0];
  room.bus!.hands[1][2] = { ...target };
  const card = { rank: target.rank, suit: target.suit };
  assert.throws(
    () => move(room, others[0], { move: "play-card", ...card }),
    /snudd/,
  );
  move(room, host, { move: "reveal-h" });
  assert.equal(hEffect(0), "take");
  move(room, others[0], { move: "play-card", ...card, version: 0 });
  const after = view(room, others[0].id);
  assert.equal(after.hand.length, 3);
  assert.deepEqual(after.plays, [{ player: 1, card: target, recipient: 1 }]);
  assert.equal(after.players[1].cards, 3);
  assert.throws(
    () => move(room, others[0], { move: "play-card", ...card }),
    /ikke lenger/,
  );
});

test("a give card needs someone else to drink", () => {
  const { room, host, others } = setup();
  move(room, host, { move: "start-h" });
  move(room, host, { move: "reveal-h" });
  move(room, host, { move: "next-h" });
  assert.deepEqual(view(room, host.id).plays, []);
  move(room, host, { move: "reveal-h" });
  assert.equal(hEffect(1), "give");
  const target = room.bus!.h[1];
  room.bus!.hands[0][0] = { ...target };
  const card = { rank: target.rank, suit: target.suit };
  assert.throws(
    () => move(room, host, { move: "play-card", ...card }),
    /Velg hvem/,
  );
  assert.throws(
    () => move(room, host, { move: "play-card", ...card, recipient: host.id }),
    /Velg hvem/,
  );
  move(room, host, { move: "play-card", ...card, recipient: others[1].id });
  assert.deepEqual(view(room, host.id).plays.at(-1), {
    player: 0,
    card: target,
    recipient: 2,
  });
});

test("only the player up guesses, and the guess cards turn one by one", () => {
  const { room, host, others } = setup();
  move(room, host, { move: "start-h" });
  for (let index = 0; index < 12; index++) {
    if (index) move(room, host, { move: "next-h" });
    move(room, host, { move: "reveal-h" });
  }
  // give the second player the most cards so they ride alone
  room.bus!.hands[0] = [];
  room.bus!.hands[2] = [];
  move(room, host, { move: "next-h" });
  const state = view(room, others[1].id);
  assert.equal(state.phase, "deal");
  assert.deepEqual(state.drivers, [1]);
  assert.equal(state.deal.stage, "guess");
  assert.ok(state.deal.cards.every((card) => card === null));
  assert.throws(
    () => move(room, host, { move: "deal-guess", guess: "red" }),
    /ikke din tur/,
  );
  move(room, others[0], { move: "deal-guess", guess: "red" });
  const shown = view(room, host.id);
  assert.equal(shown.deal.stage, "feedback");
  assert.deepEqual(shown.deal.cards[0], room.bus!.guessHands[1][0]);
  assert.equal(shown.deal.cards[1], null);
});

test("the bus cannot start with more than eight phones, and leaving ends the round", () => {
  const room = createRoom("123A", "Ada");
  const host = room.members[0];
  for (let index = 0; index < 8; index++)
    joinRoom(room, `Spiller ${index}`, "");
  applyRoomAction(room, host, {
    action: "settings",
    game: "bus",
    category: "all",
    version: room.version,
  });
  assert.throws(
    () =>
      applyRoomAction(room, host, { action: "start", version: room.version }),
    /høyst 8/,
  );
  assert.equal(room.phase, "lobby");

  const game = setup(["Emil", "Siri", "Ola"]);
  applyRoomAction(game.room, game.others[2], {
    action: "leave",
    version: game.room.version,
  });
  assert.equal(game.room.phase, "lobby");
  assert.equal(game.room.bus, null);
});
