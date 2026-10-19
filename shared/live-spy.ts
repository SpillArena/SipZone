import { shuffle } from "./engine.ts";
import type { Member, Room } from "./rooms.ts";
import { RoomError } from "./rooms.ts";

/**
 * Hvem er spionen? Everyone but one player sees the place; the spy only sees
 * the list of places and has to blend in while the others ask each other
 * questions out loud. The phones keep the secret and count the votes.
 */
export const SPY_LOCATIONS = [
  "Vorset",
  "Hytta",
  "Fjellturen",
  "Fergen til Danmark",
  "Bryllup",
  "Fotballkamp",
  "Rockekonsert",
  "Kinoen",
  "Campingplassen",
  "Skisenteret",
  "Sykehuset",
  "Flyet",
  "Skolen",
  "Bakeriet",
  "Badeland",
  "Julebord",
  "Bensinstasjonen",
  "Russebussen",
  "Båten",
  "Pizzarestauranten",
  "Nattklubben",
  "Strandpartyet",
  "Biblioteket",
  "Pøbben",
] as const;

export type SpyOutcome = "caught" | "escaped" | "guess-right" | "guess-wrong";
export interface SpyState {
  game: "spy";
  players: { id: string; name: string }[];
  phase: "talk" | "vote" | "done";
  location: string;
  spy: string;
  votes: Record<string, string>;
  guess: string | null;
  outcome: SpyOutcome | null;
}
export interface LiveSpyView {
  kind: "spy";
  phase: SpyState["phase"];
  players: { id: string; name: string }[];
  isSpy: boolean;
  /** Null for the spy, and for everyone until you are seated. */
  location: string | null;
  locations: readonly string[];
  voted: number;
  hasVoted: boolean;
  result: null | {
    spy: string;
    location: string;
    counts: Record<string, number>;
    outcome: SpyOutcome;
    guess: string | null;
  };
}

export function startSpy(room: Room, random = Math.random): SpyState {
  const players = room.members.map(({ id, name }) => ({ id, name }));
  const [spy] = shuffle(players, random);
  const [location] = shuffle(SPY_LOCATIONS, random);
  return {
    game: "spy",
    players,
    phase: "talk",
    location,
    spy: spy.id,
    votes: {},
    guess: null,
    outcome: null,
  };
}

function resolve(state: SpyState) {
  const counts: Record<string, number> = {};
  for (const target of Object.values(state.votes))
    counts[target] = (counts[target] ?? 0) + 1;
  const top = Math.max(0, ...Object.values(counts));
  const leaders = Object.keys(counts).filter((id) => counts[id] === top);
  state.outcome =
    leaders.length === 1 && leaders[0] === state.spy ? "caught" : "escaped";
  state.phase = "done";
}

export function spyMove(
  room: Room,
  member: Member,
  state: SpyState,
  input: Record<string, unknown>,
  random = Math.random,
): void {
  const move = String(input.move);
  const seated = state.players.some((player) => player.id === member.id);
  const host = member.id === room.host;
  if (move === "again") {
    if (!host) throw new RoomError("Bare verten starter ny runde.", 403);
    if (state.phase !== "done")
      throw new RoomError("Runden er ikke ferdig.", 409);
    room.table = startSpy(room, random);
    return;
  }
  if (!seated) throw new RoomError("Du er ikke med i denne runden.", 403);
  if (move === "open-vote") {
    if (!host) throw new RoomError("Bare verten åpner avstemmingen.", 403);
    if (state.phase !== "talk")
      throw new RoomError("Avstemmingen er allerede åpen.", 409);
    state.phase = "vote";
  } else if (move === "vote") {
    if (state.phase !== "vote")
      throw new RoomError("Avstemmingen er ikke åpen.", 409);
    if (state.votes[member.id])
      throw new RoomError("Du har allerede stemt.", 409);
    const target = input.target;
    if (
      typeof target !== "string" ||
      target === member.id ||
      !state.players.some((player) => player.id === target)
    )
      throw new RoomError("Velg en annen spiller.");
    state.votes[member.id] = target;
    if (state.players.every((player) => state.votes[player.id])) resolve(state);
  } else if (move === "reveal") {
    if (!host) throw new RoomError("Bare verten viser resultatet.", 403);
    if (state.phase !== "vote" || !Object.keys(state.votes).length)
      throw new RoomError("Vent på minst én stemme.", 409);
    resolve(state);
  } else if (move === "guess") {
    if (member.id !== state.spy)
      throw new RoomError("Bare spionen kan gjette sted.", 403);
    if (state.phase === "done") throw new RoomError("Runden er ferdig.", 409);
    const guess = input.location;
    if (
      typeof guess !== "string" ||
      !SPY_LOCATIONS.some((place) => place === guess)
    )
      throw new RoomError("Velg et sted fra listen.");
    state.guess = guess;
    state.outcome = guess === state.location ? "guess-right" : "guess-wrong";
    state.phase = "done";
  } else throw new RoomError("Ukjent trekk.");
}

export function spyView(state: SpyState, memberId: string): LiveSpyView {
  const isSpy = memberId === state.spy;
  const counts: Record<string, number> = {};
  for (const target of Object.values(state.votes))
    counts[target] = (counts[target] ?? 0) + 1;
  return {
    kind: "spy",
    phase: state.phase,
    players: state.players,
    isSpy,
    location: isSpy ? null : state.location,
    locations: SPY_LOCATIONS,
    voted: Object.keys(state.votes).length,
    hasVoted: Boolean(state.votes[memberId]),
    result:
      state.phase === "done" && state.outcome
        ? {
            spy: state.spy,
            location: state.location,
            counts,
            outcome: state.outcome,
            guess: state.guess,
          }
        : null,
  };
}
