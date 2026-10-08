import { CustomText, PressableScale } from "atoms/index";
import { useThemeContext } from "contexts";
import {
  ChooseGameModal,
  DeleteGameModal,
  LevelSelectionModal,
  PreferredTimeSelector,
  WidgetWrapper,
} from "molecules/index";
import React, { useMemo } from "react";
import { Image, View } from "react-native";
import Animated, {
  LinearTransition,
  ReduceMotion,
} from "react-native-reanimated";
import { Images } from "theme";
import styles from "./SportsLevelManager.styles";
import { SportsLevelManagerProps } from "./SportsLevelManager.types";
import { enterRise, exitFade, mapUserSports, MOTION } from "utils";
import { useTranslation } from "react-i18next";
import { useSportsLevelManager } from "./SportsLevelManager.logic";

const rowLayout = LinearTransition.duration(MOTION.sheet).reduceMotion(
  ReduceMotion.System
);

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
        font="sectionTitle"
        weight="bold"
        accessibilityRole="header"
        overrideStyle={themedStyles.sportsLevelTitle}
      />
      <View style={themedStyles.list}>
        {sportsList.map((item, index) => (
          <Animated.View
            key={item.id}
            entering={enterRise(index)}
            exiting={exitFade()}
            layout={rowLayout}
          >
            <WidgetWrapper overrideStyle={themedStyles.sportsLevelContainer}>
              <View style={themedStyles.iconContainer}>
                <Image source={Images[item.icon]} style={themedStyles.icon} />
              </View>
              <View style={themedStyles.textContainer}>
                <CustomText
                  text={item.name}
                  font="cardTitle"
                  weight="semiBold"
                  numberOfLines={1}
                />
                <CustomText
                  text={item.level}
                  font="caption"
                  weight="regular"
                  numberOfLines={1}
                  overrideStyle={themedStyles.level}
                />
              </View>
              <PressableScale
                onPress={() => onShowDeleteGameModal(item)}
                hitSlop={4}
                accessibilityRole="button"
                accessibilityLabel={t("profile.deleteGame", {
                  gameName: item.name,
                })}
                style={themedStyles.deleteButton}
              >
                <Image source={Images.trash} style={themedStyles.deleteIcon} />
              </PressableScale>
            </WidgetWrapper>
          </Animated.View>
        ))}
        <Animated.View layout={rowLayout}>
          <WidgetWrapper
            onPress={onAddSport}
            overrideStyle={themedStyles.addSportContainer}
          >
            <View style={themedStyles.addIconContainer}>
              <Image source={Images.plus} style={themedStyles.addIcon} />
            </View>
            <CustomText
              text={t("profile.addSport")}
              font="cardTitle"
              weight="semiBold"
              overrideStyle={themedStyles.addGameText}
            />
          </WidgetWrapper>
        </Animated.View>
      </View>
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
