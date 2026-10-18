import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyRoomAction,
  createRoom,
  joinRoom,
  publicRoom,
  ROOM_TTL,
} from "../shared/rooms.ts";
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
