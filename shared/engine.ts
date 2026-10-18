import { prompts } from "./content.ts";
import type { Prompt } from "./content.ts";
import type { Category, PromptGame } from "./catalog.ts";
export interface Player {
  id: string;
  name: string;
}
export const MAX_PLAYERS = 16;
export function validateNames(
  names: string[],
  min = 1,
  max = MAX_PLAYERS,
): string | null {
  if (names.length < min || names.length > max)
    return `Velg ${min}–${max} spillere.`;
  if (names.some((name) => !name.trim() || name.trim().length > 24))
    return "Navn må ha 1–24 tegn.";
  if (
    new Set(names.map((name) => name.trim().toLocaleLowerCase("nb"))).size !==
    names.length
  )
    return "Bruk forskjellige navn på spillerne.";
  return null;
}
export function shuffle<T>(items: readonly T[], random = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function promptDeck(
  game: PromptGame,
  category: Category = "all",
  random = Math.random,
): Prompt[] {
  return shuffle(
    prompts[game].filter(
      (prompt) => category === "all" || prompt.category === category,
    ),
    random,
  );
}
export type Suit = "♠" | "♥" | "♣" | "♦";
export interface Card {
  rank: number;
  suit: Suit;
}
export const cardLabel = (rank: number) =>
  ({ 1: "A", 11: "J", 12: "Q", 13: "K" })[rank] ?? String(rank);
export function cardDeck(random = Math.random): Card[] {
  return shuffle(
    (["♠", "♥", "♣", "♦"] as const).flatMap((suit) =>
      Array.from({ length: 13 }, (_, i) => ({ rank: i + 1, suit })),
    ),
    random,
  );
}
export interface CardRules {
  ace: "low" | "high";
  ties: "safe" | "lose";
}
export const defaultCardRules: CardRules = { ace: "low", ties: "safe" };
export function compareCards(
  current: Card,
  next: Card,
  guess: "higher" | "lower",
  rules: CardRules = defaultCardRules,
): "correct" | "wrong" | "tie" {
  if (current.rank === next.rank)
    return rules.ties === "lose" ? "wrong" : "tie";
  const value = (card: Card) =>
    card.rank === 1 && rules.ace === "high" ? 14 : card.rank;
  return (
    guess === "higher"
      ? value(next) > value(current)
      : value(next) < value(current)
  )
    ? "correct"
    : "wrong";
}
export function voteResults(
  players: Player[],
  votes: Record<string, string>,
): { counts: Record<string, number>; winners: Player[] } {
  const ids = new Set(players.map((player) => player.id));
  const counts = Object.fromEntries(players.map((player) => [player.id, 0]));
  for (const [voter, target] of Object.entries(votes))
    if (ids.has(voter) && ids.has(target)) counts[target]++;
  const max = Math.max(0, ...Object.values(counts));
  return {
    counts,
    winners: max ? players.filter((player) => counts[player.id] === max) : [],
  };
}
export const fateRules: Record<number, { title: string; text: string }> = {
  1: { title: "Skål!", text: "Alle tar en slurk sammen." },
  2: { title: "Du velger", text: "Velg én person som tar en slurk." },
  3: { title: "Din tur", text: "Ta en slurk selv." },
  4: {
    title: "Hånd på bordet",
    text: "Siste person med hånden på bordet tar en slurk.",
  },
  5: {
    title: "Kategori",
    text: "Velg en kategori. Si ett nytt ord hver på rundgang. Den første som stopper, tar en slurk.",
  },
  6: {
    title: "På rim",
    text: "Velg et ord. Fortsett med nye rim rundt bordet. Første som stopper, tar en slurk.",
  },
  7: {
    title: "Hånden i været",
    text: "Siste person med hånden i været tar en slurk.",
  },
  8: {
    title: "Makker",
    text: "Velg en annen spiller som makker. Når et kort gir én av dere en slurk, følger makkeren med én valgfri slurk. Det utløser ingen ny kjede. Paret gjelder til en av dere velger ny makker eller spillet slutter.",
  },
  9: {
    title: "Jeg har aldri",
    text: "Si noe du aldri har gjort. De som har gjort det, tar en slurk.",
  },
  10: {
    title: "Bordets miniregel",
    text: "Bli enige om et nytt navn på glasset. Glemmer noen navnet, gir gjengen en vennlig påminnelse.",
  },
  11: {
    title: "Tommelmester",
    text: "Du er tommelmester frem til neste knekt. Sett tommelen på bordet når du vil. Siste person som følger etter tar en slurk.",
  },
  12: {
    title: "Spørsmålsmester",
    text: "Du er spørsmålsmester frem til neste dame. Svarer noen på et spørsmål fra deg, tar de en slurk.",
  },
  13: {
    title: "En ny husregel",
    text: "Finn på en husregel som gjelder resten av spillet. Den fjerde kongen avslutter runden.",
  },
};
export interface FateEffect {
  card: Card;
  player: Player;
}
export function activeFateRules(history: FateEffect[]): string[] {
  const last = (rank: number) =>
    history.findLast((effect) => effect.card.rank === rank)?.player.name;
  return [
    last(11) ? `Tommelmester: ${last(11)}` : "",
    last(12) ? `Spørsmålsmester: ${last(12)}` : "",
    history.some((effect) => effect.card.rank === 10)
      ? "Bruk gjengens nye navn på glasset."
      : "",
  ].filter(Boolean);
}
export const potatoDuration = (random = Math.random) =>
  15_000 + Math.floor(random() * 30_001);
export const potatoExpired = (deadline: number, now = Date.now()) =>
  now >= deadline;
