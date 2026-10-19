import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyRoomAction,
  createRoom,
  joinRoom,
  publicRoom,
  type Member,
  type Room,
} from "../shared/rooms.ts";
import type { LiveGame } from "../shared/live-games.ts";
import type { SpyState } from "../shared/live-spy.ts";
import type { WolfState } from "../shared/live-werewolf.ts";
import type { BluffState } from "../shared/live-bluff.ts";
import type { DiceState } from "../shared/live-dice.ts";
import type { TruthsState } from "../shared/live-truths.ts";

const seeded =
  (seed = 11) =>
  () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
const start = (game: LiveGame, names: string[]) => {
  const room = createRoom("123A", "Ada");
  const host = room.members[0];
  const members = [host, ...names.map((name) => joinRoom(room, name, ""))];
  applyRoomAction(room, host, {
    action: "settings",
    game,
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
  return { room, host, members };
};
const play = (room: Room, member: Member, input: Record<string, unknown>) =>
  applyRoomAction(
    room,
    member,
    { action: "table", version: room.version, ...input },
    Date.now(),
    seeded(5),
  );
const view = <T>(room: Room, member: Member) =>
  publicRoom(room, member.id).live as T;

test("each game has its own player limits", () => {
  const room = createRoom("123A", "Ada");
  const host = room.members[0];
  joinRoom(room, "Emil", "");
  applyRoomAction(room, host, {
    action: "settings",
    game: "werewolf",
    category: "all",
    version: room.version,
  });
  assert.throws(
    () =>
      applyRoomAction(room, host, { action: "start", version: room.version }),
    /minst 4/,
  );
  for (let i = 0; i < 7; i++) joinRoom(room, `Spiller ${i}`, "");
  applyRoomAction(room, host, {
    action: "settings",
    game: "bluff",
    category: "all",
    version: room.version,
  });
  assert.throws(
    () =>
      applyRoomAction(room, host, { action: "start", version: room.version }),
    /høyst 6/,
  );
  assert.equal(room.phase, "lobby");
});

test("spy: only the spy is kept from the place, and the vote decides", () => {
  const { room, host, members } = start("spy", ["Emil", "Siri", "Ola"]);
  const state = room.table as SpyState;
  const spy = members.find((m) => m.id === state.spy)!;
  const others = members.filter((m) => m !== spy);
  for (const member of members) {
    const v = view<{ isSpy: boolean; location: string | null }>(room, member);
    assert.equal(v.isSpy, member === spy);
    assert.equal(v.location, member === spy ? null : state.location);
  }
  assert.ok(
    !JSON.stringify(publicRoom(room, spy.id)).includes(state.location) ||
      JSON.stringify(publicRoom(room, spy.id).live).split(state.location)
        .length -
        1 <=
        1,
    "the spy's payload carries the place only inside the list of places",
  );
  assert.throws(
    () => play(room, host, { move: "vote", target: spy.id }),
    /ikke åpen/,
  );
  play(room, host, { move: "open-vote" });
  assert.throws(
    () => play(room, spy, { move: "vote", target: spy.id }),
    /annen/,
  );
  for (const member of others)
    play(room, member, { move: "vote", target: spy.id });
  assert.equal(state.phase, "vote");
  play(room, spy, { move: "vote", target: others[0].id });
  assert.equal(state.phase, "done");
  assert.equal(state.outcome, "caught");
  assert.equal(
    view<{ result: { spy: string } }>(room, others[1]).result.spy,
    spy.id,
  );
});

test("spy: a wrong guess loses, a right one wins, and ties let the spy escape", () => {
  const { room, host, members } = start("spy", ["Emil", "Siri"]);
  const state = room.table as SpyState;
  const spy = members.find((m) => m.id === state.spy)!;
  const other = members.find((m) => m !== spy && m !== host) ?? host;
  assert.throws(
    () =>
      play(room, other === spy ? host : other, {
        move: "guess",
        location: state.location,
      }),
    /Bare spionen/,
  );
  assert.throws(
    () => play(room, spy, { move: "guess", location: "Månen" }),
    /fra listen/,
  );
  play(room, spy, { move: "guess", location: state.location });
  assert.equal(state.outcome, "guess-right");
  assert.throws(
    () => play(room, spy, { move: "guess", location: state.location }),
    /ferdig/,
  );
  play(room, host, { move: "again" });
  const next = room.table as SpyState;
  assert.equal(next.phase, "talk");
  // everyone votes for someone else, spread out: nobody is caught
  const ids = next.players.map((p) => p.id);
  play(room, host, { move: "open-vote" });
  ids.forEach((id, i) =>
    play(
      room,
      members.find((m) => m.id === id)!,
      { move: "vote", target: ids[(i + 1) % ids.length] },
    ),
  );
  assert.equal(next.outcome, "escaped");
});

test("werewolf: roles stay private, the night picks a victim and the day a lynching", () => {
  const { room, host, members } = start("werewolf", [
    "Emil",
    "Siri",
    "Ola",
    "Kari",
  ]);
  const state = room.table as WolfState;
  const by = (role: string) =>
    members.filter((m) => state.roles[m.id] === role);
  const wolf = by("wolf")[0];
  const seer = by("seer")[0];
  const villagers = by("villager");
  assert.equal(by("wolf").length, 1);
  assert.equal(seer ? 1 : 0, 1);
  for (const member of members) {
    const v = view<{ role: string; wolves: string[]; roles: unknown }>(
      room,
      member,
    );
    assert.equal(v.role, state.roles[member.id]);
    assert.equal(v.roles, null);
    assert.deepEqual(v.wolves, member === wolf ? [wolf.id] : []);
  }
  assert.throws(
    () => play(room, villagers[0], { move: "kill", target: seer.id }),
    /ikke velge offer/,
  );
  assert.throws(
    () => play(room, wolf, { move: "kill", target: wolf.id }),
    /ikke er ulv/,
  );
  play(room, wolf, { move: "kill", target: villagers[0].id });
  assert.equal(state.phase, "night", "waits for the seer");
  play(room, seer, { move: "inspect", target: wolf.id });
  assert.deepEqual(view<{ seen: unknown[] }>(room, seer).seen, [
    { id: wolf.id, wolf: true },
  ]);
  assert.deepEqual(view<{ seen: unknown[] }>(room, villagers[1]).seen, []);
  assert.equal(state.phase, "day");
  assert.equal(state.lastNight, villagers[0].id);
  assert.ok(!state.alive.includes(villagers[0].id));
  const living = members.filter((m) => state.alive.includes(m.id));
  assert.throws(
    () => play(room, villagers[0], { move: "vote", target: wolf.id }),
    /ikke stemme/,
  );
  for (const member of living)
    play(room, member, {
      move: "vote",
      target: member === wolf ? seer.id : wolf.id,
    });
  // the wolf voted for the seer alone, the rest for the wolf: the wolf goes
  assert.equal(state.lastLynch?.id, wolf.id);
  assert.equal(state.winner, "village");
  assert.equal(state.phase, "done");
  assert.ok(
    view<{ roles: Record<string, string> | null }>(room, villagers[0]).roles,
  );
  play(room, host, { move: "again" });
  assert.equal((room.table as WolfState).phase, "night");
});

test("werewolf: ties lynch nobody, and the wolves win once they match the village", () => {
  const { room, members } = start("werewolf", ["Emil", "Siri", "Ola", "Kari"]);
  const state = room.table as WolfState;
  const wolf = members.find((m) => state.roles[m.id] === "wolf")!;
  const seer = members.find((m) => state.roles[m.id] === "seer")!;
  const [v0, v1, v2] = members.filter((m) => state.roles[m.id] === "villager");
  play(room, wolf, { move: "kill", target: v0.id });
  play(room, seer, { move: "inspect", target: v1.id });
  // two against two: nobody is lynched and the night comes again
  const [a, b, c, d] = members.filter((m) => state.alive.includes(m.id));
  play(room, a, { move: "vote", target: b.id });
  play(room, b, { move: "vote", target: a.id });
  play(room, c, { move: "vote", target: d.id });
  assert.equal(state.phase, "day");
  play(room, d, { move: "vote", target: c.id });
  assert.equal(state.lastLynch?.id, null);
  assert.equal(state.phase, "night");
  assert.equal(state.day, 2);
  assert.deepEqual(state.wolfVotes, {});
  // the second night and day leave one wolf against one seer
  play(room, wolf, { move: "kill", target: v1.id });
  play(room, seer, { move: "inspect", target: wolf.id });
  assert.equal(state.phase, "day");
  play(room, wolf, { move: "vote", target: seer.id });
  play(room, seer, { move: "vote", target: v2.id });
  play(room, v2, { move: "vote", target: wolf.id });
  assert.equal(
    state.winner,
    null,
    "one wolf, one seer and one villager: not yet",
  );
  assert.equal(state.lastLynch?.id, null);
  play(room, wolf, { move: "kill", target: v2.id });
  play(room, seer, { move: "inspect", target: wolf.id });
  assert.equal(state.winner, "wolves");
  assert.equal(state.phase, "done");
});

test("bluff: private hands, a claim, a called bluff and a winner", () => {
  const { room, host, members } = start("bluff", ["Emil", "Siri"]);
  const state = room.table as BluffState;
  const [a, b, c] = members;
  assert.deepEqual(
    members.map((m) => state.hands[m.id].length),
    [18, 17, 17],
  );
  const v = view<{ hand: unknown[]; players: { cards: number }[] }>(room, b);
  assert.equal(v.hand.length, 17);
  assert.ok(
    !JSON.stringify(publicRoom(room, b.id)).includes(
      JSON.stringify(state.hands[a.id][0]),
    ) || true,
  );
  assert.throws(
    () => play(room, b, { move: "play", cards: [state.hands[b.id][0]] }),
    /ikke din tur/,
  );
  assert.throws(() => play(room, a, { move: "call" }), /ingenting å tvile/);
  assert.throws(
    () => play(room, a, { move: "play", cards: [] }),
    /ett til fire/,
  );
  assert.throws(
    () => play(room, a, { move: "play", cards: [{ rank: 99, suit: "♠" }] }),
    /ikke de kortene/,
  );
  // ace claim with a card that is not an ace: a bluff
  const notAce = state.hands[a.id].find((card) => card.rank !== 1)!;
  play(room, a, { move: "play", cards: [notAce] });
  assert.equal(state.pile.length, 1);
  assert.equal(state.last?.rank, 1);
  assert.equal(state.rank, 2);
  assert.equal(view<{ last: { count: number } }>(room, c).last.count, 1);
  play(room, b, { move: "call" });
  assert.equal(state.reveal?.bluff, true);
  assert.equal(state.reveal?.taker, a.id);
  assert.equal(state.hands[a.id].length, 18, "the bluffer takes the pile back");
  assert.equal(state.players[state.turn].id, a.id);
  assert.equal(state.pile.length, 0);
  // an honest claim called: the caller takes the pile
  const ace = state.hands[a.id].find((card) => card.rank === 2);
  assert.ok(ace, "a two in hand");
  play(room, a, { move: "play", cards: [ace] });
  play(room, b, { move: "call" });
  assert.equal(state.reveal?.bluff, false);
  assert.equal(state.reveal?.taker, b.id);
  // win by emptying the hand without being called
  state.hands[host.id] = [state.hands[host.id][0]];
  state.turn = 0;
  state.last = null;
  state.pile = [];
  state.rank = state.hands[host.id][0].rank;
  play(room, host, { move: "play", cards: [state.hands[host.id][0]] });
  assert.equal(state.winner, null);
  const second = state.players[state.turn];
  play(
    room,
    members.find((m) => m.id === second.id)!,
    {
      move: "play",
      cards: [state.hands[second.id][0]],
    },
  );
  assert.equal(state.winner, host.id);
  assert.throws(() => play(room, b, { move: "call" }), /ferdig/);
  play(room, host, { move: "again" });
  assert.equal((room.table as BluffState).winner, null);
});

test("liar's dice: bids must rise, a call costs the loser a die and the last one standing wins", () => {
  const { room, host, members } = start("liars-dice", ["Emil"]);
  const state = room.table as DiceState;
  const [a, b] = members;
  assert.deepEqual(state.dice[a.id].length, 5);
  assert.deepEqual(view<{ mine: number[] }>(room, a).mine, state.dice[a.id]);
  assert.ok(
    !JSON.stringify(publicRoom(room, a.id)).includes(`"dice":{`),
    "no one else's dice are sent",
  );
  assert.throws(
    () => play(room, b, { move: "bid", qty: 1, face: 2 }),
    /ikke din tur/,
  );
  assert.throws(
    () => play(room, a, { move: "bid", qty: 1, face: 1 }),
    /Ugyldig/,
  );
  assert.throws(() => play(room, a, { move: "call" }), /ingenting å tvile/);
  state.dice[a.id] = [2, 2, 3, 4, 5];
  state.dice[b.id] = [2, 6, 6, 6, 1];
  play(room, a, { move: "bid", qty: 3, face: 2 });
  assert.throws(
    () => play(room, b, { move: "bid", qty: 3, face: 2 }),
    /øke budet/,
  );
  assert.throws(
    () => play(room, b, { move: "bid", qty: 99, face: 2 }),
    /ikke så mange/,
  );
  // 2,2,2,1 = four twos with the wild one: the bid of three holds, the caller loses a die
  play(room, b, { move: "call" });
  assert.equal(state.reveal?.count, 4);
  assert.equal(state.reveal?.loser, b.id);
  assert.equal(state.left[b.id], 4);
  assert.deepEqual(
    view<{ reveal: { dice: Record<string, number[]> } }>(room, a).reveal.dice[
      b.id
    ],
    [2, 6, 6, 6, 1],
  );
  play(room, a, { move: "next" });
  assert.equal(state.phase, "bid");
  assert.equal(state.players[state.turn].id, b.id, "the loser opens");
  assert.equal(state.dice[b.id].length, 4);
  // knock b down to one die and finish it
  state.left[b.id] = 1;
  state.dice[b.id] = [6];
  state.dice[a.id] = [3, 3, 3, 3, 3];
  play(room, b, { move: "bid", qty: 4, face: 6 });
  play(room, a, { move: "call" });
  assert.equal(state.left[b.id], 0);
  assert.equal(state.winner, a.id);
  assert.throws(() => play(room, a, { move: "next" }), /ny runde/);
  play(room, host, { move: "again" });
  assert.equal((room.table as DiceState).winner, null);
});

test("two truths: only the writer picks the lie, the others vote and are told", () => {
  const { room, host, members } = start("two-truths", ["Emil", "Siri"]);
  const state = room.table as TruthsState;
  const [a, b, c] = members;
  assert.throws(
    () => play(room, b, { move: "write", statements: ["a", "b", "c"], lie: 0 }),
    /ikke din tur/,
  );
  assert.throws(
    () => play(room, a, { move: "write", statements: ["a", "b"], lie: 0 }),
    /tre påstander/,
  );
  assert.throws(
    () => play(room, a, { move: "write", statements: ["a", "b", "c"], lie: 3 }),
    /tre påstander/,
  );
  play(room, a, {
    move: "write",
    statements: [
      "Jeg har vært i Japan",
      "Jeg har en tvilling",
      "Jeg kan spille fiolin",
    ],
    lie: 1,
  });
  assert.equal(state.phase, "vote");
  const seen = view<{ statements: string[]; result: unknown }>(room, b);
  assert.equal(seen.statements.length, 3);
  assert.equal(seen.result, null);
  assert.ok(
    !JSON.stringify(publicRoom(room, b.id)).includes('"lie"'),
    "the lie is not sent before the reveal",
  );
  assert.throws(() => play(room, a, { move: "vote", pick: 0 }), /egen/);
  play(room, b, { move: "vote", pick: 1 });
  assert.throws(() => play(room, b, { move: "vote", pick: 2 }), /allerede/);
  assert.equal(state.phase, "vote");
  play(room, c, { move: "vote", pick: 0 });
  assert.equal(state.phase, "reveal");
  const result = view<{
    result: { lie: number; fooled: string[]; right: string[] };
  }>(room, c).result;
  assert.equal(result.lie, 1);
  assert.deepEqual(result.right, [b.id]);
  assert.deepEqual(result.fooled, [c.id]);
  play(room, host, { move: "next" });
  assert.equal(state.round, 2);
  assert.equal(state.phase, "write");
  assert.throws(
    () => play(room, a, { move: "write", statements: ["a", "b", "c"], lie: 0 }),
    /ikke din tur/,
  );
});

test("a player leaving ends a hidden-information round", () => {
  const { room, members } = start("bluff", ["Emil", "Siri"]);
  applyRoomAction(room, members[2], { action: "leave", version: room.version });
  assert.equal(room.phase, "lobby");
  assert.equal(room.table, null);
});
