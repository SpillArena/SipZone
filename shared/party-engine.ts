import type { Player } from "./engine.ts";
import { dares, type DareLevel } from "./party-content.ts";
import type { Category } from "./catalog.ts";

export function darePool(category: Category, level: DareLevel) {
  return dares.filter(
    (dare) =>
      dare.level === level &&
      (category === "all" || dare.category === category),
  );
}
export function normalizeAnswer(value: string) {
  return value
    .toLocaleLowerCase("nb-NO")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/[^\p{L}\p{N}]/gu, "");
}
export function matchesAnswer(value: string, answers: readonly string[]) {
  const normalized = normalizeAnswer(value);
  return (
    normalized.length > 0 &&
    answers.some((answer) => normalizeAnswer(answer) === normalized)
  );
}
export function timedAnswer(
  deadline: number,
  correct: boolean,
  now = Date.now(),
): "correct" | "wrong" | "timeout" {
  return now >= deadline ? "timeout" : correct ? "correct" : "wrong";
}
export function secondsLeft(deadline: number, now = Date.now()) {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}
/** Bottle points upward at zero degrees; seat zero is at twelve o'clock. */
export function bottleRotation(previous: number, seat: number, seats: number) {
  const target = (seat / seats) * 360;
  const current = ((previous % 360) + 360) % 360;
  const delta = (target - current + 360) % 360;
  return previous + 4 * 360 + (Math.min(delta, 360 - delta) < 1e-8 ? 0 : delta);
}
export interface Duel {
  first: Player;
  second: Player;
}
export interface Bracket {
  matches: Duel[];
  byes: Player[];
}
/** Odd fields get one bye. Each player occurs exactly once in this stage. */
export function bracketStage(players: readonly Player[]): Bracket {
  const matches: Duel[] = [];
  for (let index = 0; index + 1 < players.length; index += 2)
    matches.push({ first: players[index], second: players[index + 1] });
  return {
    matches,
    byes: players.length % 2 ? [players[players.length - 1]] : [],
  };
}
export interface QuizAttempt {
  playerId: string;
  outcome: "correct" | "wrong" | "timeout";
}
export function quizStandings(attempts: readonly QuizAttempt[]) {
  const scores: Record<string, number> = {};
  const streaks: Record<string, number> = {};
  for (const attempt of attempts) {
    scores[attempt.playerId] =
      (scores[attempt.playerId] ?? 0) + (attempt.outcome === "correct" ? 1 : 0);
    streaks[attempt.playerId] =
      attempt.outcome === "correct" ? (streaks[attempt.playerId] ?? 0) + 1 : 0;
  }
  return { scores, streaks };
}
