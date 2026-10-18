import { compareCards, type Card, type CardRules } from "./engine.ts";
export interface HigherLowerOptions extends CardRules {
  mode: "quick" | "streak";
  rounds: number;
}
export interface HigherLowerState {
  cursor: number;
  turn: number;
  pending: number;
  secured: number;
  scores: Record<string, number>;
  result: "correct" | "wrong" | "tie" | "banked" | null;
  finished: boolean;
}
export const initialHigherLower = (): HigherLowerState => ({
  cursor: 1,
  turn: 0,
  pending: 0,
  secured: 0,
  scores: {},
  result: null,
  finished: false,
});
export type HigherLowerAction =
  | { type: "guess"; direction: "higher" | "lower" }
  | { type: "continue" }
  | { type: "bank" }
  | { type: "next" };
/** One deck is consumed across all turns. Only secured points survive a miss. */
export function playHigherLower(
  state: HigherLowerState,
  action: HigherLowerAction,
  deck: readonly Card[],
  playerIds: readonly string[],
  options: HigherLowerOptions,
): HigherLowerState {
  if (state.finished || !playerIds.length || state.cursor >= deck.length)
    return state;
  const playerId = playerIds[state.turn % playerIds.length];
  const last = state.cursor === deck.length - 1;
  const canContinue =
    options.mode === "streak" &&
    (state.result === "correct" || state.result === "tie") &&
    !last;
  const bank = (points: number) => ({
    ...state.scores,
    [playerId]: (state.scores[playerId] ?? 0) + points,
  });
  if (action.type === "guess") {
    if (state.result !== null) return state;
    const result = compareCards(
      deck[state.cursor - 1],
      deck[state.cursor],
      action.direction,
      options,
    );
    const pending =
      result === "wrong" ? 0 : state.pending + (result === "correct" ? 1 : 0);
    const secured =
      options.mode === "quick"
        ? result === "correct"
          ? 1
          : 0
        : last
          ? pending
          : 0;
    return {
      ...state,
      result,
      pending: options.mode === "streak" && !last ? pending : 0,
      secured,
      scores: secured ? bank(secured) : state.scores,
    };
  }
  if (action.type === "continue")
    return canContinue
      ? { ...state, cursor: state.cursor + 1, result: null, secured: 0 }
      : state;
  if (action.type === "bank")
    return canContinue
      ? {
          ...state,
          result: "banked",
          scores: bank(state.pending),
          secured: state.pending,
          pending: 0,
        }
      : state;
  if (action.type === "next" && state.result !== null && !canContinue) {
    if (last || state.turn + 1 >= options.rounds)
      return { ...state, finished: true };
    return {
      ...state,
      cursor: state.cursor + 1,
      turn: state.turn + 1,
      result: null,
      pending: 0,
      secured: 0,
    };
  }
  return state;
}
