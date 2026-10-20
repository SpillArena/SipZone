import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyRoomAction,
  createRoom,
  joinRoom,
  publicRoom,
  normalizeRoom,
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
const setup = (
  names = ["Emil", "Siri"],
  finishGuesses = true,
  readyIntro = true,
) => {
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
  if (readyIntro) readyAll(room);
  if (finishGuesses) {
    while (room.bus!.phase === "deal") {
      const deal = room.bus!.deal;
      const player = room.members[deal.player];
      move(room, player, {
        move: "deal-guess",
        guess: ["red", "higher", "inside", "♠"][deal.question],
      });
      if (room.bus!.deal.correct)
        move(room, player, {
          move: "deal-award",
          recipient: room.members[(deal.player + 1) % room.members.length].id,
        });
      ackAll(room);
    }
    readyAll(room);
  }
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

const ackAll = (room: Room) => {
  while (room.bus?.pendingDrinks.length) {
    const drink = room.bus.pendingDrinks[0];
    move(
      room,
      room.members.find(
        (member) => member.id === room.bus!.players[drink.player].id,
      )!,
      { move: "confirm-drink", drinkId: drink.id },
    );
  }
};

const readyAll = (room: Room) => {
  const intro = room.bus?.phaseIntro;
  if (!intro) return;
  for (const player of room.bus!.players)
    move(
      room,
      room.members.find((member) => member.id === player.id)!,
      {
        move: "ready-phase",
        introId: intro.id,
      },
    );
};

test("phase intros wait for every player's own readiness and reject stale intros", () => {
  const { room, host, others } = setup(undefined, false, false);
  const intro = view(room, host.id).phaseIntro!;
  assert.equal(intro.phase, "deal");
  assert.deepEqual(intro.ready, []);
  assert.throws(
    () => move(room, host, { move: "deal-guess", guess: "red" }),
    /alle spillerne/,
  );
  assert.throws(
    () => move(room, host, { move: "ready-phase", introId: "old" }),
    /ikke aktiv/,
  );
  const revision = room.version;
  move(room, host, {
    move: "ready-phase",
    introId: intro.id,
    player: others[0].id,
    ready: [0, 1, 2],
  });
  assert.deepEqual(view(room, host.id).phaseIntro?.ready, [0]);
  move(room, host, { move: "ready-phase", introId: intro.id });
  assert.deepEqual(view(room, host.id).phaseIntro?.ready, [0]);
  // Readiness from several phones can arrive with the same room revision.
  for (const member of others)
    move(room, member, {
      move: "ready-phase",
      introId: intro.id,
      version: revision,
    });
  assert.equal(view(room, host.id).phaseIntro, null);
  assert.throws(
    () => move(room, host, { move: "ready-phase", introId: intro.id }),
    /ikke aktiv/,
  );
  move(room, host, { move: "deal-guess", guess: "red" });
});

test("pyramid intros wait for everyone and open the first row directly", () => {
  const { room, host, others } = setup();
  room.bus!.hands = [room.bus!.hands[0], [], []];
  room.bus!.table = { ...room.bus!.table, index: 11, stage: "open" };
  move(room, host, { move: "next-h" });
  const intro = view(room, host.id).phaseIntro!;
  assert.equal(intro.phase, "bus");
  assert.deepEqual(room.bus!.drivers, [0]);
  assert.throws(
    () => move(room, host, { move: "pick-pyramid", index: 0 }),
    /alle spillerne/,
  );
  move(room, others[0], { move: "ready-phase", introId: intro.id });
  assert.ok(room.bus!.phaseIntro);
  readyAll(room);
  assert.equal(room.bus!.phaseIntro, null);
  assert.equal(room.bus!.bus.stage, "pick");
  assert.equal(room.bus!.bus.row, 1);

  const tie = setup();
  tie.room.bus!.table = { ...tie.room.bus!.table, index: 11, stage: "open" };
  move(tie.room, tie.host, { move: "next-h" });
  assert.equal(tie.room.bus!.phase, "driver");
  move(tie.room, tie.host, { move: "ride-together" });
  assert.equal(tie.room.bus!.phaseIntro?.phase, "bus");
  assert.equal(tie.room.bus!.phaseIntro?.ready.length, 0);
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
  // History contains cards already revealed in the shared guessing rounds.
  assert.equal(mine.deal.results.length, room.members.length * 4);
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
  assert.equal(view(room, host.id).hStage, "covered");
  assert.equal(view(room, host.id).h[0], null);
  move(room, host, { move: "reveal-h" });
  assert.deepEqual(view(room, others[1].id).h[0], room.bus!.h[0]);
});

test("players lay matching cards from their own phone, once each", () => {
  const { room, host, others } = setup();
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
  assert.deepEqual(after.plays, [
    { player: 1, card: target, recipient: 1, hIndex: 0 },
  ]);
  assert.equal(after.players[1].cards, 3);
  const pending = after.pendingDrinks[0];
  assert.throws(() => move(room, host, { move: "next-h" }), /bekrefter/);
  assert.throws(
    () => move(room, host, { move: "confirm-drink", drinkId: pending.id }),
    /Bare den som/,
  );
  ackAll(room);
  assert.throws(
    () => move(room, others[0], { move: "play-card", ...card }),
    /ikke lenger/,
  );
});

test("a give card needs someone else to drink", () => {
  const { room, host, others } = setup();
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
    hIndex: 1,
  });
});

test("only the drinker can confirm; turns stay blocked until wrong or assigned drinks are confirmed", () => {
  const { room, host, others } = setup(undefined, false);
  const initial = view(room, host.id);
  assert.equal(initial.phase, "deal");
  assert.equal(initial.deal.stage, "guess");
  assert.deepEqual(initial.hand, []);
  assert.deepEqual(initial.deal.results, []);
  assert.ok(initial.deal.cards.every((card) => card === null));
  assert.ok(initial.h.every((card) => card === null));
  const initialPayload = JSON.stringify(initial);
  for (const card of room.bus!.guessHands.flat())
    assert.ok(
      !initialPayload.includes(JSON.stringify(card)),
      "future guess card leaked",
    );
  assert.throws(
    () => move(room, others[0], { move: "deal-guess", guess: "red" }),
    /ikke din tur/,
  );
  const first = room.bus!.guessHands[0][0];
  const red = first.suit === "♥" || first.suit === "♦";
  const oldVersion = room.version;
  move(room, host, { move: "deal-guess", guess: red ? "black" : "red" });
  const shown = view(room, host.id);
  assert.equal(shown.deal.player, 0);
  assert.equal(shown.deal.stage, "feedback");
  assert.deepEqual(shown.hand, [first]);
  assert.deepEqual(shown.deal.results[0], {
    player: 0,
    question: 0,
    card: first,
    correct: false,
    recipient: null,
  });
  assert.deepEqual(shown.deal.cards[0], first);
  const drinkId = shown.pendingDrinks[0].id;
  assert.throws(
    () => move(room, others[0], { move: "confirm-drink", drinkId }),
    /Bare den som/,
  );
  assert.throws(() => move(room, host, { move: "next-player" }), /bekrefter/);
  normalizeRoom(room);
  assert.equal(room.bus!.deal.player, 0);
  assert.equal(room.bus!.pendingDrinks[0].id, drinkId);
  move(room, host, { move: "confirm-drink", drinkId });
  assert.equal(room.bus!.deal.player, 1);
  assert.throws(
    () => move(room, host, { move: "confirm-drink", drinkId }),
    /ikke aktiv/,
  );
  assert.throws(
    () =>
      move(room, host, {
        move: "deal-guess",
        guess: "red",
        version: oldVersion,
      }),
    /endret/,
  );
  const second = room.bus!.guessHands[1][0];
  move(room, others[0], {
    move: "deal-guess",
    guess: second.suit === "♥" || second.suit === "♦" ? "red" : "black",
  });
  assert.equal(room.bus!.deal.player, 1);
  assert.equal(room.bus!.deal.stage, "feedback");
  const awardVersion = room.version;
  assert.throws(
    () =>
      move(room, others[0], { move: "deal-award", recipient: others[0].id }),
    /trekket/,
  );
  move(room, others[0], { move: "deal-award", recipient: host.id });
  assert.equal(room.bus!.deal.player, 1);
  assert.equal(room.bus!.deal.stage, "feedback");
  assert.equal(view(room, host.id).pendingDrinks[0].player, 0);
  assert.throws(
    () =>
      move(room, others[0], {
        move: "confirm-drink",
        drinkId: room.bus!.pendingDrinks[0].id,
      }),
    /Bare den som/,
  );
  ackAll(room);
  assert.equal(room.bus!.deal.player, 2);
  assert.equal(room.bus!.deal.stage, "guess");
  assert.equal(view(room, host.id).deal.results.at(-1)?.recipient, 0);
  assert.throws(
    () =>
      move(room, others[0], {
        move: "deal-award",
        recipient: host.id,
        version: awardVersion,
      }),
    /endret/,
  );
  while (room.bus!.phase === "deal") {
    const deal = room.bus!.deal;
    const player = room.members[deal.player];
    move(room, player, {
      move: "deal-guess",
      guess: ["red", "higher", "inside", "♠"][deal.question],
    });
    if (room.bus!.deal.stage === "feedback" && room.bus!.deal.correct)
      move(room, player, {
        move: "deal-award",
        recipient: room.members[(deal.player + 1) % room.members.length].id,
      });
    ackAll(room);
  }
  assert.equal(room.bus!.phase, "h");
  assert.equal(room.bus!.phaseIntro?.phase, "h");
  assert.deepEqual(room.bus!.phaseIntro?.ready, []);
  assert.throws(() => move(room, host, { move: "reveal-h" }), /alle spillerne/);
  readyAll(room);
  assert.equal(room.bus!.table.stage, "covered");
  assert.deepEqual(room.bus!.hands, room.bus!.guessHands);
  assert.deepEqual(view(room, host.id).hand, room.bus!.guessHands[0]);
  assert.equal(
    view(room, host.id).deal.results.length,
    room.members.length * 4,
  );
  assert.deepEqual(view(room, host.id).deal.cards, []);
  assert.equal(
    new Set(
      [...room.bus!.hands.flat(), ...room.bus!.h].map(
        (card) => `${card.rank}${card.suit}`,
      ),
    ).size,
    room.members.length * 4 + 12,
  );
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

test("a player may choose an earlier revealed H card while the next card stays covered", () => {
  const { room, host, others } = setup();
  move(room, host, { move: "reveal-h" });
  move(room, host, { move: "next-h" });
  const card = { ...room.bus!.h[0] };
  room.bus!.hands[1][0] = card;
  move(room, others[0], { move: "play-card", ...card, hIndex: 0 });
  const shown = view(room, others[0].id);
  assert.equal(shown.hand.length, 3);
  assert.equal(shown.hIndex, 1);
  assert.equal(shown.hStage, "covered");
  assert.equal(shown.h[1], null);
  assert.equal(shown.plays.at(-1)?.hIndex, 0);
  assert.equal(shown.plays.at(-1)?.recipient, 1);
  ackAll(room);
  assert.throws(
    () => move(room, others[0], { move: "play-card", ...card, hIndex: 0 }),
    /ikke lenger/,
  );
});

test("the chosen target determines the recipient rule, even when the current card has another rule", () => {
  const { room, host, others } = setup();
  for (let index = 0; index <= 2; index++) {
    if (index) move(room, host, { move: "next-h" });
    move(room, host, { move: "reveal-h" });
  }
  const card = { ...room.bus!.h[1] };
  room.bus!.h[2] = { ...card };
  room.bus!.hands[0][0] = card;
  assert.throws(
    () => move(room, host, { move: "play-card", ...card, hIndex: 1 }),
    /Velg hvem/,
  );
  assert.throws(
    () =>
      move(room, host, {
        move: "play-card",
        ...card,
        hIndex: 1,
        recipient: host.id,
      }),
    /Velg hvem/,
  );
  move(room, host, {
    move: "play-card",
    ...card,
    hIndex: 1,
    recipient: others[0].id,
  });
  assert.equal(view(room, host.id).plays.at(-1)?.recipient, 1);
  assert.equal(view(room, host.id).plays.at(-1)?.hIndex, 1);
  assert.equal(view(room, host.id).hIndex, 2);
});

test("hidden, invalid and non-matching H targets cannot consume a card", () => {
  const { room, host } = setup();
  move(room, host, { move: "reveal-h" });
  const card = { ...room.bus!.hands[0][0] };
  room.bus!.h[0] = {
    rank: card.rank === 13 ? 1 : card.rank + 1,
    suit: card.suit,
  };
  const before = JSON.stringify(room.bus);
  for (const hIndex of [-1, 1, 12, 0.5, "0", null]) {
    assert.throws(
      () => move(room, host, { move: "play-card", ...card, hIndex }),
      /snudd/,
    );
    assert.equal(JSON.stringify(room.bus), before);
  }
  assert.throws(
    () => move(room, host, { move: "play-card", ...card, hIndex: 0 }),
    /trekket/,
  );
  assert.equal(JSON.stringify(room.bus), before);
});

test("a matching shot target uses its own rule and keeps the host's position", () => {
  const { room, host, others } = setup();
  for (let index = 0; index <= 11; index++) {
    if (index) move(room, host, { move: "next-h" });
    move(room, host, { move: "reveal-h" });
  }
  const card = { ...room.bus!.h[10] };
  room.bus!.hands[1][0] = card;
  move(room, others[0], { move: "play-card", ...card, hIndex: 10 });
  assert.equal(view(room, others[0].id).plays.at(-1)?.hIndex, 10);
  assert.equal(view(room, others[0].id).plays.at(-1)?.recipient, 1);
  assert.equal(view(room, others[0].id).hIndex, 11);
});

test("all bus riders must confirm a pyramid penalty before the host can restart", () => {
  const { room, host, others } = setup();
  room.bus!.phase = "bus";
  room.bus!.drivers = [0, 1];
  room.bus!.bus.stage = "pick";
  room.bus!.pyramid[0] = { rank: 12, suit: "♥" };
  move(room, host, { move: "pick-pyramid", index: 0 });
  assert.equal(room.bus!.pendingDrinks.length, 2);
  assert.ok(room.bus!.pendingDrinks.every((drink) => drink.sips === 2));
  assert.throws(() => move(room, host, { move: "retry-bus" }), /bekrefter/);
  const mine = room.bus!.pendingDrinks.find((drink) => drink.player === 0)!;
  move(room, host, { move: "confirm-drink", drinkId: mine.id });
  assert.equal(room.bus!.pendingDrinks.length, 1);
  assert.throws(() => move(room, host, { move: "retry-bus" }), /bekrefter/);
  const theirs = room.bus!.pendingDrinks[0];
  assert.throws(
    () => move(room, others[1], { move: "confirm-drink", drinkId: theirs.id }),
    /Bare den som/,
  );
  move(room, others[0], { move: "confirm-drink", drinkId: theirs.id });
  assert.equal(room.bus!.bus.attempt, 2);
  assert.equal(room.bus!.bus.row, 1);
  assert.equal(room.bus!.bus.stage, "pick");
  assert.deepEqual(room.bus!.pendingDrinks, []);
});

test("safe pyramid picks advance automatically, reject previous rows and finish at the top", () => {
  const { room, host } = setup();
  room.bus!.phase = "bus";
  room.bus!.drivers = [0];
  room.bus!.bus.stage = "pick";
  room.bus!.pyramid = room.bus!.pyramid.map(() => ({ rank: 1, suit: "♥" }));
  for (const [row, index] of [0, 5, 9, 12, 14].entries()) {
    assert.equal(room.bus!.bus.row, row + 1);
    move(room, host, { move: "pick-pyramid", index });
    assert.deepEqual(room.bus!.pendingDrinks, []);
    assert.ok(view(room, host.id).bus.pyramid[index]);
    if (row < 4) {
      assert.equal(room.bus!.bus.row, row + 2);
      assert.equal(room.bus!.bus.stage, "pick");
      const before = JSON.stringify(room.bus);
      assert.throws(
        () => move(room, host, { move: "pick-pyramid", index }),
        /trekket/,
      );
      assert.throws(() => move(room, host, { move: "next-row" }), /trekket/);
      assert.equal(JSON.stringify(room.bus), before);
    }
  }
  assert.equal(room.bus!.phase, "done");
  assert.equal(room.bus!.endReason, "cleared");
});

test("any finished player can open a fresh lobby for everyone and the next game starts clean", () => {
  const { room, host, others } = setup();
  const lobby = () =>
    applyRoomAction(room, others[0], {
      action: "lobby",
      version: room.version,
    });
  assert.throws(lobby, /Bare verten/);
  room.bus!.phase = "done";
  room.bus!.endReason = "cleared";
  const code = room.code;
  const members = room.members.map((member) => member.id);
  lobby();
  assert.equal(room.phase, "lobby");
  assert.equal(room.bus, null);
  assert.deepEqual(room.busPlays, []);
  assert.equal(room.code, code);
  assert.deepEqual(
    room.members.map((member) => member.id),
    members,
  );
  applyRoomAction(room, host, { action: "start", version: room.version });
  const fresh = view(room, host.id);
  assert.equal(fresh.phase, "deal");
  assert.equal(fresh.phaseIntro?.phase, "deal");
  assert.deepEqual(fresh.phaseIntro?.ready, []);
  assert.deepEqual(fresh.hand, []);
  assert.deepEqual(fresh.pendingDrinks, []);
  assert.deepEqual(fresh.deal.results, []);
  assert.equal(fresh.bus.attempt, 1);
});
