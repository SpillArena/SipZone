import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyRoomAction,
  createRoom,
  joinRoom,
  normalizeRoom,
  publicRoom,
  ROOM_TTL,
} from "../shared/rooms.ts";
import { LIVE_GAMES, nextWake, tick } from "../shared/live-games.ts";
import { emojiPuzzles, quickQuestions } from "../shared/party-content.ts";
import { verifyAccount } from "../shared/auth.ts";
const setup = () => {
  const room = createRoom("123A", "Ada");
  const host = room.members[0];
  const friend = joinRoom(room, "Emil", "");
  applyRoomAction(room, host, { action: "start", version: room.version });
  return { room, host, friend };
};
test("room start and host-only actions enforce permissions and revisions", () => {
  const room = createRoom("123A", "Ada", 1000);
  assert.equal(room.expires, 1000 + ROOM_TTL);
  const host = room.members[0];
  assert.throws(
    () => applyRoomAction(room, host, { action: "start", version: 0 }),
    /minst én/,
  );
  const friend = joinRoom(room, "Emil", "");
  assert.throws(
    () => applyRoomAction(room, friend, { action: "start", version: 0 }),
    /Bare verten/,
  );
  applyRoomAction(room, host, { action: "start", version: 0 });
  assert.throws(
    () => applyRoomAction(room, host, { action: "next", version: 0 }),
    /endret/,
  );
  assert.throws(() => joinRoom(room, "Siri", ""), /har startet/);
});
test("private votes accept simultaneous revisions but reject duplicate and stale rounds", () => {
  const { room, host, friend } = setup();
  const version = room.version;
  applyRoomAction(room, host, {
    action: "vote",
    target: friend.id,
    round: 1,
    version,
  });
  applyRoomAction(room, friend, {
    action: "vote",
    target: host.id,
    round: 1,
    version,
  });
  assert.equal(Object.keys(room.votes).length, 2);
  assert.throws(
    () =>
      applyRoomAction(room, friend, {
        action: "vote",
        target: host.id,
        round: 1,
      }),
    /allerede/,
  );
  assert.throws(
    () =>
      applyRoomAction(room, friend, {
        action: "vote",
        target: host.id,
        round: 0,
      }),
    /ikke åpen/,
  );
});
test("public views never reveal tokens, accounts, private votes or future prompts, including winners", () => {
  const { room, host, friend } = setup();
  host.ticket = "secret-ticket";
  applyRoomAction(room, friend, { action: "vote", target: host.id, round: 1 });
  const before = publicRoom(room, host.id);
  assert.equal(before.results, null);
  assert.equal(before.hasVoted, false);
  assert.equal(publicRoom(room, friend.id).hasVoted, true);
  applyRoomAction(room, host, { action: "reveal", version: room.version });
  const view = publicRoom(room, host.id);
  assert.deepEqual(view.results?.winners, [{ id: host.id, name: "Ada" }]);
  const output = JSON.stringify(view);
  for (const secret of [
    host.token,
    friend.token,
    "secret-ticket",
    room.deck[1].text,
    '"votes"',
    '"account"',
    '"deck"',
  ])
    assert.ok(!output.includes(secret), secret);
});
test("leaving transfers host and removes votes for the departing player", () => {
  const { room, host, friend } = setup();
  applyRoomAction(room, friend, { action: "vote", target: host.id, round: 1 });
  applyRoomAction(room, host, { action: "leave" });
  assert.equal(room.host, friend.id);
  assert.equal(room.phase, "lobby");
  assert.deepEqual(room.votes, {});
});
test("verified account recovers its seat with a rotated private token", () => {
  const { room, friend } = setup();
  const previous = friend.token;
  const recovered = joinRoom(room, "Emil", "");
  assert.equal(recovered.id, friend.id);
  assert.notEqual(recovered.token, previous);
  assert.equal(room.members.length, 2);
});
test("successive rounds consume the prompt deck and reset votes", () => {
  const { room, host, friend } = setup();
  applyRoomAction(room, friend, { action: "vote", target: host.id, round: 1 });
  const seen = new Set<string>();
  for (let i = 0; i < 36; i++) {
    seen.add(publicRoom(room, host.id).prompt!.id);
    applyRoomAction(room, host, { action: "next", version: room.version });
    assert.deepEqual(room.votes, {});
  }
  assert.equal(seen.size, 36);
  assert.equal(room.round, 37);
});
test("room caps membership at sixteen", () => {
  const room = createRoom("123A", "host");
  for (let i = 0; i < 15; i++) joinRoom(room, `guest${i}`, "");
  assert.throws(() => joinRoom(room, "overflow", ""), /fullt/);
});
test("joining an empty room before cleanup appoints a new host", () => {
  const room = createRoom("123A", "Ada");
  applyRoomAction(room, room.members[0], { action: "leave" });
  const newcomer = joinRoom(room, "Emil", "");
  assert.equal(room.host, newcomer.id);
  assert.equal(room.phase, "lobby");
});
test("account verification accepts hub format and rejects forgery and expired tokens", async () => {
  const secret = "test-only-key";
  const sign = async (name: string, expires: number) => {
    const body = Buffer.from(
      JSON.stringify({ u: name, e: expires, i: Date.now() }),
    ).toString("base64url");
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    return `${body}.${Buffer.from(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body))).toString("base64url")}`;
  };
  const valid = await sign("Ada", Date.now() + 60_000);
  assert.equal((await verifyAccount(secret, valid))?.name, "Ada");
  assert.equal(await verifyAccount("wrong-key", valid), null);
  assert.equal(
    await verifyAccount(secret, await sign("Ada", Date.now() - 1)),
    null,
  );
  assert.equal(await verifyAccount(secret, `${valid}x`), null);
  assert.equal(await verifyAccount(undefined, valid), null);
  assert.equal(await verifyAccount(secret, "broken"), null);
});
const play = (game: string, extra = 0) => {
  const room = createRoom("123A", "Ada");
  const host = room.members[0];
  const friend = joinRoom(room, "Emil", "");
  for (let i = 0; i < extra; i++) joinRoom(room, `Gjest${i}`, "");
  applyRoomAction(room, host, {
    action: "settings",
    game,
    category: "all",
    version: room.version,
  });
  applyRoomAction(room, host, { action: "start", version: room.version });
  return { room, host, friend };
};
test("every live game starts, advances and returns to the lobby", () => {
  for (const { id } of LIVE_GAMES) {
    const { room, host } = play(id);
    assert.ok(publicRoom(room, host.id).round === 1, id);
    for (let i = 0; i < 80; i++)
      applyRoomAction(room, host, { action: "next", version: room.version });
    assert.ok(room.round === 81, id);
    applyRoomAction(room, host, { action: "lobby", version: room.version });
    assert.equal(publicRoom(room, host.id).live, null);
  }
});
test("higher or lower scores every guess at once and sips the wrong ones", () => {
  const { room, host, friend } = play("higher-lower");
  room.cards[0] = { rank: 5, suit: "♠" };
  room.cards[1] = { rank: 9, suit: "♥" };
  applyRoomAction(room, host, { action: "answer", value: "higher", round: 1 });
  const hidden = publicRoom(room, host.id).live;
  assert.equal(hidden?.kind === "higher-lower" && hidden.next, null);
  assert.equal(room.revealed, false);
  applyRoomAction(room, friend, { action: "answer", value: "lower", round: 1 });
  assert.equal(room.revealed, true);
  const view = publicRoom(room, host.id);
  assert.equal(view.scores[host.id], 1);
  assert.equal(view.scores[friend.id] ?? 0, 0);
  assert.equal(
    view.live?.kind === "higher-lower" &&
      view.live.results?.[friend.id].outcome,
    "wrong",
  );
  assert.throws(
    () =>
      applyRoomAction(room, host, {
        action: "answer",
        value: "lower",
        round: 1,
      }),
    /ikke åpne/,
  );
});
test("emoji decoder hides the answer, accepts aliases and rewards the fastest", () => {
  const { room, host, friend } = play("emoji");
  const puzzle = emojiPuzzles[room.queue[0]];
  const before = JSON.stringify(publicRoom(room, host.id));
  assert.ok(!before.includes(puzzle.answer));
  applyRoomAction(room, friend, {
    action: "answer",
    value: puzzle.answer.toUpperCase(),
    round: 1,
  });
  assert.throws(
    () =>
      applyRoomAction(room, host, { action: "answer", value: "  ", round: 1 }),
    /Ugyldig/,
  );
  applyRoomAction(room, host, {
    action: "answer",
    value: "helt feil",
    round: 1,
  });
  const view = publicRoom(room, host.id);
  assert.equal(view.scores[friend.id], 2);
  assert.equal(view.scores[host.id] ?? 0, 0);
  assert.equal(view.live?.kind === "emoji" && view.live.answer, puzzle.answer);
});
test("quickfire reveals the right choice only after the round and rejects bad picks", () => {
  const { room, host, friend } = play("quickfire");
  const right = quickQuestions[room.queue[0]].answer;
  assert.equal(
    publicRoom(room, host.id).live?.kind === "quickfire" &&
      publicRoom(room, host.id).live!.answer,
    null,
  );
  assert.throws(
    () =>
      applyRoomAction(room, host, { action: "answer", value: "9", round: 1 }),
    /Ugyldig/,
  );
  applyRoomAction(room, host, {
    action: "answer",
    value: String(right),
    round: 1,
  });
  applyRoomAction(room, host, { action: "reveal", version: room.version });
  assert.equal(room.revealed, true);
  assert.equal(room.scores[host.id], 2);
  assert.equal(room.scores[friend.id] ?? 0, 0);
});
test("roulette lets only the active player spin once per round", () => {
  const { room, host, friend } = play("roulette");
  assert.throws(
    () => applyRoomAction(room, friend, { action: "spin" }),
    /ikke din tur/,
  );
  applyRoomAction(room, host, { action: "spin" }, Date.now(), () => 0.5);
  assert.equal(
    publicRoom(room, friend.id).live?.kind === "roulette" &&
      publicRoom(room, friend.id).live!.outcome,
    4,
  );
  assert.throws(
    () => applyRoomAction(room, host, { action: "spin" }),
    /allerede/,
  );
  applyRoomAction(room, host, { action: "next", version: room.version });
  assert.equal(room.pick, null);
  applyRoomAction(room, friend, { action: "spin" });
});
test("hot potato hides the fuse, passes only from the holder and explodes on time", () => {
  const { room, host, friend } = play("hot-potato");
  const potato = room.potato!;
  const holder = potato.holder === host.id ? host : friend;
  const other = holder === host ? friend : host;
  assert.ok(
    !JSON.stringify(publicRoom(room, host.id)).includes(
      String(potato.deadline),
    ),
  );
  assert.throws(
    () => applyRoomAction(room, other, { action: "pass", target: holder.id }),
    /ikke poteten/,
  );
  assert.throws(
    () => applyRoomAction(room, holder, { action: "pass", target: holder.id }),
    /annen spiller/,
  );
  applyRoomAction(room, holder, { action: "pass", target: other.id });
  assert.equal(room.potato!.holder, other.id);
  assert.equal(tick(room, potato.deadline - 1), false);
  assert.equal(tick(room, potato.deadline), true);
  assert.equal(tick(room, potato.deadline + 5), false);
  assert.equal(room.scores[other.id], 1);
  assert.throws(
    () => applyRoomAction(room, other, { action: "pass", target: holder.id }),
    /allerede/,
  );
  assert.ok(nextWake(room) === room.expires);
  applyRoomAction(room, host, { action: "next", version: room.version });
  assert.equal(room.potato!.exploded, false);
  assert.ok(nextWake(room) < room.expires);
});
test("a leaving potato holder hands the potato on and rooms from before the new games still load", () => {
  const { room, host } = play("hot-potato", 1);
  const holder = room.members.find((m) => m.id === room.potato!.holder)!;
  applyRoomAction(room, holder, { action: "leave" });
  assert.ok(room.members.some((m) => m.id === room.potato!.holder));
  const old = JSON.parse(JSON.stringify(createRoom("123B", "Ada")));
  delete old.scores;
  delete old.queue;
  delete old.cards;
  delete old.pick;
  delete old.potato;
  const loaded = normalizeRoom(old);
  assert.deepEqual([loaded.scores, loaded.queue, loaded.pick], [{}, [], null]);
  assert.ok(host);
});
