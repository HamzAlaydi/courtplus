import { Item } from "utils";

export type LevelSelectionModalProps = {
  onLevelSelect: (level: Item) => void;
  selectedLevel?: string;
  onClose: () => void;
};
