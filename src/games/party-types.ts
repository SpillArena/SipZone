import type { Player } from "../../shared/engine";
import type { GameSettings } from "../features/Setup";
export interface PartyGameProps {
  players: Player[];
  settings: GameSettings;
  onFinish: () => void;
}
