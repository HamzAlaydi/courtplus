import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useNavigation } from "@react-navigation/native";
import { useAddSport, useDeleteSport } from "apis";
import { showSnackbar } from "atoms/Snackbar/SnackBar.utils";
import { useEffect, useRef, useState } from "react";
import { useAppStore } from "store";
import { invalidateQuery, Item, SportItem } from "utils";

export const useSportsLevelManager = (isCompleteProfile?: boolean) => {
  const [game, setGame] = useState<SportItem | null>(null);
  const deleteGameModalRef = useRef<BottomSheetModal>(null);
  const chooseGameModalRef = useRef<BottomSheetModal>(null);
  const levelSelectionModalRef = useRef<BottomSheetModal>(null);
  const preferredTimeSelectorRef = useRef<BottomSheetModal>(null);
  const [selectedGame, setSelectedGame] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const { mutateAsync: deleteSportMutation } = useDeleteSport();
  const { mutateAsync: addSportMutation } = useAddSport();
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);

  const toggleLoading = useAppStore((state) => state.toggleLoading);
  const { goBack } = useNavigation();
  let timeoutId: NodeJS.Timeout | null = null;

  const onShowDeleteGameModal = (selectedGame: SportItem) => {
    setGame(selectedGame);
    deleteGameModalRef.current?.present();
  };

  const onHideDeleteGameModal = () => {
    setGame(null);
    deleteGameModalRef.current?.dismiss();
  };

  const onDeleteGame = async () => {
    try {
      toggleLoading(true);
      await deleteSportMutation(game?.id ?? "");
      onHideDeleteGameModal();
      invalidateQuery("getProfile");
      !isCompleteProfile && goBack();
    } catch (error) {
      showSnackbar({ message: (error as Error).message });
    } finally {
      toggleLoading(false);
    }
  };

  const onShowChooseGameModal = (selectedSportGame: SportItem) => {
    setGame(selectedSportGame);

    setSelectedGame(selectedSportGame.value);
    chooseGameModalRef.current?.present();
  };

  const onHideChooseGameModal = () => {
    setGame(null);
    chooseGameModalRef.current?.dismiss();
  };

  const onShowLevelSelectionModal = () => {
    levelSelectionModalRef.current?.present();
  };

  const onHideLevelSelectionModal = () => {
    levelSelectionModalRef.current?.dismiss();
  };

  const onGameSelect = (game: Item) => {
    setSelectedGame(game.key);
    onHideChooseGameModal();
    onShowLevelSelectionModal();
  };

  const onAddSport = () => {
    chooseGameModalRef.current?.present();
  };

  const onLevelSelect = (level: Item) => {
    setSelectedLevel(level.key);
    onHideLevelSelectionModal();
    preferredTimeSelectorRef.current?.present();
  };

  const onTimeSelect = (time: string) => {
    preferredTimeSelectorRef.current?.dismiss();
    onAddUserSport(time);
  };

  const onAddUserSport = async (selectedTimePreference: string) => {
    try {
      toggleLoading(true);
      await addSportMutation({
        name: selectedGame,
        level: selectedLevel,
        timePreference: selectedTimePreference,
      });
      invalidateQuery("getProfile");
      !isCompleteProfile && goBack();
    } catch (error) {
      showSnackbar({ message: (error as Error).message });
    } finally {
      toggleLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return {
    deleteGameModalRef,
    onShowDeleteGameModal,
    onHideDeleteGameModal,
    game,
    onDeleteGame,
    onShowChooseGameModal,
    onHideChooseGameModal,
    onShowLevelSelectionModal,
    onHideLevelSelectionModal,
    chooseGameModalRef,
    levelSelectionModalRef,
    onGameSelect,
    selectedGame,
    onAddSport,
    onLevelSelect,
    selectedLevel,
    preferredTimeSelectorRef,
    onTimeSelect,
    isGameModalOpen,
  };
};
