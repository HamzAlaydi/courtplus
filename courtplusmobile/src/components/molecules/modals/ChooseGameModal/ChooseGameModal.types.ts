import { Item } from "utils";

export interface ChooseGameModalProps {
  onGameSelect: (game: Item) => void;
  selectedGame?: string;
  isOpen?: boolean;
}
