import { useMemo, useState } from "react";
import { Item, sortList } from "utils";
import { SortModalProps } from "./SortModal.types";

export const useSortModal = ({
  sortItem,
  onClear,
  onSelectSort,
}: SortModalProps) => {
  const sortItems = useMemo(() => sortList, []);
  const [selectedSort, setSelectedSort] = useState<Item | null>(sortItem);

  const handleSelectSort = (sort: Item) => {
    setSelectedSort(sort);
  };

  const handleClear = () => {
    onClear();
  };

  const handleDone = () => {
    onSelectSort(selectedSort!!);
  };

  const isButtonDisabled = !selectedSort;

  return {
    sortItems,
    selectedSort,
    handleClear,
    handleSelectSort,
    isButtonDisabled,
    handleDone,
  };
};
