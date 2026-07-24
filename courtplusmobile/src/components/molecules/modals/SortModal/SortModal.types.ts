import { Item } from "utils";

export type SortModalProps = {
  sortItem: Item | null;
  onClear: () => void;
  onSelectSort: (sort: Item) => void;
};
