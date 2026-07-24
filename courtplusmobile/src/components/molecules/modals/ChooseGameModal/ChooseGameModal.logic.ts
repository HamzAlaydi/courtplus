import { useMemo, useState } from "react";
import { Item, sportList } from "utils";
import { ChooseGameModalProps } from "./ChooseGameModal.types";

export const useChooseGameModal = ({
  selectedGame,
  onGameSelect,
}: ChooseGameModalProps) => {
  const selectedSport = useMemo(
    () => sportList.find((item) => item.key === selectedGame),
    [selectedGame]
  );

  const [selectedGameItem, setSelectedGameItem] = useState<Item | undefined>(
    selectedSport
  );

  const onGameItemSelect = (game: Item) => {
    setSelectedGameItem(game);
  };

  const onNextPress = () => {
    onGameSelect(selectedGameItem!!);
  };

  const onDismiss = () => {
    setSelectedGameItem(selectedSport);
  };

  const items = useMemo(() => sportList, []);

  const isNextButtonDisabled = !selectedGameItem;

  return {
    items,
    onGameItemSelect,
    selectedGameItem,
    onNextPress,
    isNextButtonDisabled,
    onDismiss,
  };
};
