import type { Player } from "./engine.ts";
export type FatePartners = Record<string, string>;
/** Each player has one mutual partner. Choosing anew releases both old pairs. */
export function chooseFatePartner(
  players: readonly Player[],
  partners: FatePartners,
  source: string,
  target: string,
): FatePartners {
  const ids = new Set(players.map((player) => player.id));
  if (source === target || !ids.has(source) || !ids.has(target))
    return partners;
  const next = { ...partners };
  for (const id of [source, target]) {
    const previous = next[id];
    if (previous && next[previous] === id) delete next[previous];
    delete next[id];
  }
  next[source] = target;
  next[target] = source;
  return next;
}
export function fatePartnerPairs(
  players: readonly Player[],
  partners: FatePartners,
): [Player, Player][] {
  return players.flatMap((player, index) => {
    const partner = players.findIndex(
      (other) => other.id === partners[player.id],
    );
    return partner > index && partners[players[partner].id] === player.id
      ? [[player, players[partner]] as [Player, Player]]
      : [];
  });
}
