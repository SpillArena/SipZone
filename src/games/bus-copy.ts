import type { Card } from "../../shared/engine";
import type { BusGuess, BusState } from "../../shared/bus";

/* Words and small helpers shared by the pass-and-play Bussruta and the Live one. */
export const guesses: [BusGuess, string][][] = [
  [
    ["red", "♥ Rød"],
    ["black", "♠ Svart"],
  ],
  [
    ["higher", "↑ Høyere"],
    ["lower", "↓ Lavere"],
  ],
  [
    ["inside", "↔ Innenfor"],
    ["outside", "⇥ Utenfor"],
  ],
  [
    ["♠", "♠ Spar"],
    ["♥", "♥ Hjerter"],
    ["♣", "♣ Kløver"],
    ["♦", "♦ Ruter"],
  ],
];
export const questions = [
  "Rød eller svart?",
  "Høyere eller lavere enn kort 1?",
  "Innenfor eller utenfor kort 1 og 2?",
  "Hvilken sort har kort 4?",
];
export const guessHints = [
  "Gjett fargen på det markerte kortet.",
  "Sammenlign det markerte kortet med kort 1. Ess er høyest. Likt er feil.",
  "Kort 3 skal være strengt mellom kort 1 og 2, eller utenfor. Lik en grense er feil.",
  "Gjett sorten på det markerte kortet.",
];
export const effectLabels = {
  give: "Gi bort 1 slurk 🍺",
  take: "Ta 1 slurk 🍺",
  shot: "Ta en shot 🥃",
};
export const sips = (n: number) => `${n} ${n === 1 ? "slurk" : "slurker"}`;
export const PYRAMID_RESET_DELAY_MS = 1600;
export const PYRAMID_DRINK_DELAY_MS = 3000;
/** Stands in for a card the phone has not been told yet; only its back is drawn. */
export const HIDDEN_CARD: Card = { rank: 1, suit: "♠" };
export const busPhase = (
  phase: BusState["phase"],
  endReason: BusState["endReason"],
) =>
  phase === "h" || phase === "driver" || endReason === "no-driver"
    ? 1
    : phase === "deal"
      ? 0
      : 2;
