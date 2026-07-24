import { CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import {
  ChooseGameModal,
  DeleteGameModal,
  LevelSelectionModal,
  PreferredTimeSelector,
  WidgetWrapper,
} from "molecules/index";
import React, { useMemo } from "react";
import { Image, TouchableOpacity, View } from "react-native";
import { Images } from "theme";
import styles from "./SportsLevelManager.styles";
import { SportsLevelManagerProps } from "./SportsLevelManager.types";
import { mapUserSports } from "utils";
import { useTranslation } from "react-i18next";
import { useSportsLevelManager } from "./SportsLevelManager.logic";

const SportsLevelManager = ({
  sports,
  isCompleteProfile,
}: SportsLevelManagerProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const sportsList = useMemo(() => mapUserSports(sports), [sports]);
  const { t } = useTranslation();
  const {
    deleteGameModalRef,
    onShowDeleteGameModal,
    onHideDeleteGameModal,
    game,
    onDeleteGame,
    onHideLevelSelectionModal,
    chooseGameModalRef,
    levelSelectionModalRef,
    selectedGame,
    onGameSelect,
    onAddSport,
    onLevelSelect,
    preferredTimeSelectorRef,
    onTimeSelect,
    isGameModalOpen,
  } = useSportsLevelManager(isCompleteProfile);

  return (
    <View>
      <CustomText
        text={t("profile.sportsLevel")}
        font="chip"
        weight="regular"
        overrideStyle={themedStyles.sportsLevelTitle}
      />
      {sportsList.map((item) => (
        <View key={item.id} style={themedStyles.sportsLevelContainer}>
          <View style={themedStyles.sportsLevelWidget}>
            <WidgetWrapper overrideStyle={themedStyles.gameWidget}>
              <Image source={Images[item.icon]} />
              <CustomText text={item.name} font="headline3" weight="medium" />
            </WidgetWrapper>
            <WidgetWrapper overrideStyle={themedStyles.levelContainer}>
              <CustomText
                text={item.level}
                font="body"
                weight="medium"
                numberOfLines={1}
                overrideStyle={themedStyles.level}
              />
            </WidgetWrapper>
          </View>

          <TouchableOpacity onPress={() => onShowDeleteGameModal(item)}>
            <Image source={Images.trash} />
          </TouchableOpacity>
        </View>
      ))}
      <WidgetWrapper
        onPress={onAddSport}
        overrideStyle={themedStyles.addSportContainer}
      >
        <Image source={Images.plus} />
        <CustomText
          text={t("profile.addSport")}
          font="headline3"
          weight="medium"
          overrideStyle={themedStyles.addGameText}
        />
      </WidgetWrapper>
      <DeleteGameModal
        ref={deleteGameModalRef}
        onDeleteGame={onDeleteGame}
        onCancel={onHideDeleteGameModal}
        gameName={game?.name ?? ""}
      />
      <ChooseGameModal
        selectedGame={selectedGame}
        ref={chooseGameModalRef}
        onGameSelect={onGameSelect}
        isOpen={isGameModalOpen}
      />
      <LevelSelectionModal
        onLevelSelect={onLevelSelect}
        onClose={onHideLevelSelectionModal}
        ref={levelSelectionModalRef}
      />
      <PreferredTimeSelector
        ref={preferredTimeSelectorRef}
        onTimeSelect={onTimeSelect}
      />
    </View>
  );
};

export default SportsLevelManager;
