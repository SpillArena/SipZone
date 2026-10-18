import { test } from "node:test";
import assert from "node:assert/strict";
import { request } from "node:http";
const base = process.env.SIPZONE_ROOMS_URL;
const secret = process.env.SIPZONE_TEST_SECRET;
const account = async (name, expiry = Date.now() + 60_000) => {
  const body = Buffer.from(
    JSON.stringify({ u: name, e: expiry, i: Date.now() }),
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
const call = async (auth, token = "", input, code = "123A") => {
  const response = await fetch(base + code, {
    method: input ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${auth}`,
      "X-Room-Token": token,
      ...(input ? { "Content-Type": "application/json" } : {}),
    },
    body: input ? JSON.stringify(input) : undefined,
  });
  return { status: response.status, data: await response.json() };
};
const waitFor = (socket, predicate) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("WebSocket message timed out"));
    }, 5000);
    const message = (event) => {
      const data = JSON.parse(event.data);
      if (predicate(data)) {
        cleanup();
        resolve(data);
      }
    };
    const cleanup = () => {
      clearTimeout(timer);
      socket.removeEventListener("message", message);
    };
    socket.addEventListener("message", message);
  });
test("real Worker: auth, rooms, WebSockets, anonymous votes, recovery and host transfer", async () => {
  const hostAuth = await account("Ada");
  const guestAuth = await account("Emil");
  const thirdAuth = await account("Siri");
  assert.equal((await call("")).status, 401);
  assert.equal(
    (await call(await account("Expired", Date.now() - 1))).status,
    401,
  );
  const created = await call(hostAuth, "", { action: "create" });
  assert.equal(created.status, 200);
  const hostToken = created.data.token;
  assert.ok(hostToken);
  assert.equal((await call(hostAuth, "", { action: "create" })).status, 409);
  const joined = await call(guestAuth, "", { action: "join" });
  const guestToken = joined.data.token;
  assert.equal(joined.status, 200);
  assert.equal((await call(guestAuth, hostToken)).status, 401);
  assert.equal(
    (
      await call(guestAuth, guestToken, {
        action: "start",
        version: joined.data.version,
      })
    ).status,
    403,
  );
  const ticket = await call(guestAuth, guestToken, { action: "ticket" });
  const socketUrl = `${base.replace("http:", "ws:")}123A/socket?ticket=${ticket.data.ticket}`;
  const socket = new WebSocket(socketUrl);
  const first = await waitFor(socket, (view) => view.phase === "lobby");
  assert.equal(first.members.length, 2);
  try {
    const reusedStatus = await new Promise((resolve, reject) => {
      const attempt = request(
        socketUrl.replace("ws:", "http:"),
        {
          headers: {
            Connection: "Upgrade",
            Upgrade: "websocket",
            "Sec-WebSocket-Version": "13",
            "Sec-WebSocket-Key": Buffer.from(
              crypto.getRandomValues(new Uint8Array(16)),
            ).toString("base64"),
          },
        },
        (response) => {
          response.resume();
          resolve(response.statusCode);
        },
      );
      attempt.on("upgrade", (_response, connection) => {
        connection.destroy();
        resolve(101);
      });
      attempt.on("error", reject);
      attempt.end();
    });
    assert.equal(reusedStatus, 401);
    const latest = (await call(hostAuth, hostToken)).data;
    const broadcast = waitFor(socket, (view) => view.phase === "playing");
    const started = await call(hostAuth, hostToken, {
      action: "start",
      version: latest.version,
    });
    assert.equal(started.status, 200);
    const remote = await broadcast;
    assert.equal(remote.prompt.id, started.data.prompt.id);
    assert.equal((await call(thirdAuth, "", { action: "join" })).status, 409);
    const hostVote = await call(hostAuth, hostToken, {
      action: "vote",
      target: joined.data.you,
      round: 1,
    });
    assert.equal(hostVote.status, 200);
    assert.equal(hostVote.data.results, null);
    const voted = await call(guestAuth, guestToken, {
      action: "vote",
      target: joined.data.you,
      round: 1,
    });
    assert.equal(voted.status, 200);
    assert.equal(voted.data.hasVoted, true);
    assert.equal(
      (
        await call(guestAuth, guestToken, {
          action: "vote",
          target: joined.data.you,
          round: 1,
        })
      ).status,
      409,
    );
    const revealBroadcast = waitFor(socket, (view) => view.revealed);
    const revealed = await call(hostAuth, hostToken, {
      action: "reveal",
      version: voted.data.version,
    });
    assert.equal(revealed.status, 200);
    const result = await revealBroadcast;
    assert.equal(result.results.counts[joined.data.you], 2);
    assert.deepEqual(Object.keys(result.results.winners[0]).sort(), [
      "id",
      "name",
    ]);
    const publicText = JSON.stringify(result);
    for (const value of [
      hostToken,
      guestToken,
      '"votes"',
      '"deck"',
      '"account"',
    ])
      assert.ok(!publicText.includes(value));
    const recovery = await call(guestAuth, "", { action: "join" });
    assert.equal(recovery.status, 200);
    assert.notEqual(recovery.data.token, guestToken);
    assert.equal((await call(guestAuth, guestToken)).status, 401);
    const leaving = await call(hostAuth, hostToken, { action: "leave" });
    assert.equal(leaving.status, 200);
    const remaining = (await call(guestAuth, recovery.data.token)).data;
    assert.equal(remaining.host, joined.data.you);
    assert.equal(remaining.phase, "lobby");
    assert.equal(remaining.members.length, 1);
    const oversized = await fetch(base + "123A", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${guestAuth}`,
        "Content-Type": "application/json",
        "X-Room-Token": recovery.data.token,
      },
      body: JSON.stringify({ action: "join", padding: "x".repeat(5000) }),
    });
    assert.equal(oversized.status, 400);
    console.log(
      "Local durable storage, WebSocket broadcasts and room permissions verified.",
    );
  } finally {
    socket.close();
  }
});
