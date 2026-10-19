/** Small helpers shared by the Live games where every phone holds something private. */
export type Send = (input: Record<string, unknown>) => void;
export interface Seat {
  id: string;
  name: string;
}

/** "Ada", "Ada (deg)" — the name as the table reads it. */
export const nameOf = (
  players: Seat[],
  id: string | null | undefined,
  you?: string,
) => {
  const found = players.find((player) => player.id === id);
  if (!found) return "?";
  return found.id === you ? `${found.name} (deg)` : found.name;
};
/** "Ada, Emil og Siri" */
export const listNames = (names: string[]) =>
  names.length < 2
    ? (names[0] ?? "")
    : `${names.slice(0, -1).join(", ")} og ${names.at(-1)}`;
