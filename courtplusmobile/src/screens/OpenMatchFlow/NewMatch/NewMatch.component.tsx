import { Chip, CustomButton, CustomSwitch, CustomText } from "atoms/index";
import {
  AddPlayersModal,
  GenderModal,
  Header,
  LevelSelectionModal,
  ListActionItem,
  SportChips,
  WidgetWrapper,
} from "molecules/index";
import { AvatarSlots, MainWrapper } from "organisms/index";
import React from "react";
import { useTranslation } from "react-i18next";
import { Image, View } from "react-native";
import Animated from "react-native-reanimated";
import { Images } from "theme";
import { enterRise } from "utils";
import { useNewMatch } from "./NewMatch.logic";

const NewMatchScreen = () => {
  const { t } = useTranslation();
  const {
    list,
    themedStyles,
    levelBottomSheetRef,
    requiresApproval,
    setRequiresApproval,
    matchSizes,
    selectedLevel,
    setSelectedLevel,
    onCloseLevelModal,
    playerAside,
    setPlayerAside,
    addPlayersModalRef,
    onCloseAddPlayersModal,
    onOpenAddPlayersModal,
    onAddPlayer,
    showPlayersButton,
    participants,
    isCreteMatchButtonDisabled,
    onCreateMatchPress,
    setSelectedSport,
    genderModalRef,
    onSelectGender,
    selectedGender,
  } = useNewMatch();
  return (
    <MainWrapper
      scrollEnabled
      overrideContentStyle={themedStyles.scrollContent}
    >
      <Header whiteColor title={t("openMatch.newMatch")} />
      <View style={themedStyles.content}>
        <Animated.View entering={enterRise(0)} style={themedStyles.section}>
          <CustomText
            text={t("openMatch.selectGame")}
            font="sectionTitle"
            weight="small"
          />
          <SportChips
            overrideScrollStyle={themedStyles.sportsScroll}
            overrideStyle={themedStyles.sports}
            withAllSports={false}
            withViewWrapper={false}
            onSportPress={setSelectedSport}
          />
        </Animated.View>
        <Animated.View entering={enterRise(1)} style={themedStyles.section}>
          <CustomText
            font="sectionTitle"
            weight="small"
            text={t("openMatch.gameType")}
          />
          <View style={themedStyles.gameContainer}>
            {matchSizes.map((item) => (
              <Chip
                key={item.key}
                isSelected={item.key === playerAside?.key}
                title={item.title}
                onPress={() => setPlayerAside(item)}
              />
            ))}
          </View>
        </Animated.View>
        <Animated.View entering={enterRise(2)}>
          <WidgetWrapper disabled overrideStyle={themedStyles.playersContainer}>
            <CustomText
              font="caption"
              weight="medium"
              text={t("openMatch.AddplayersMatch")}
              overrideStyle={themedStyles.addPlayerTitle}
            />
            <View style={themedStyles.avatarSlots}>
              <AvatarSlots
                showRemoveButton={false}
                slots={participants}
                showUsername={false}
              />
            </View>
            {showPlayersButton && (
              <CustomButton
                title={t("openMatch.addPlayers")}
                variant="outline"
                size="small"
                onPress={onOpenAddPlayersModal}
                overrideStyle={themedStyles.addPlayersButton}
                leftIcon={
                  <Image
                    source={Images.plus}
                    style={themedStyles.addPlayersIcon}
                  />
                }
              />
            )}
          </WidgetWrapper>
        </Animated.View>
        <Animated.View entering={enterRise(3)}>
          <ListActionItem
            showSeparator
            list={list}
            overrideImageStyle={themedStyles.listImage}
          />
        </Animated.View>
        <Animated.View
          entering={enterRise(4)}
          style={themedStyles.memberContainer}
        >
          <View style={themedStyles.memberIconTile}>
            <Image source={Images.lock} style={themedStyles.memberIcon} />
          </View>
          <CustomText
            font="headline3"
            weight="medium"
            text={t("openMatch.membersAccepted")}
            overrideStyle={themedStyles.memberText}
          />
          <Image source={Images.info} style={themedStyles.info} />
          <CustomSwitch
            value={requiresApproval}
            onValueChange={setRequiresApproval}
          />
        </Animated.View>
        <View style={themedStyles.bottomContainer}>
          <CustomButton
            title={t("openMatch.Create Match")}
            variant={isCreteMatchButtonDisabled ? "disabledDark" : "primary"}
            onPress={onCreateMatchPress}
            disabled={isCreteMatchButtonDisabled}
          />
        </View>
      </View>
      <LevelSelectionModal
        onLevelSelect={setSelectedLevel}
        selectedLevel={selectedLevel.key}
        onClose={onCloseLevelModal}
        ref={levelBottomSheetRef}
      />
      <AddPlayersModal
        participants={participants}
        onClose={onCloseAddPlayersModal}
        ref={addPlayersModalRef}
        onAddPlayer={onAddPlayer}
      />
      <GenderModal
        isWhite
        ref={genderModalRef}
        onSelectGender={onSelectGender}
        selectedGender={selectedGender}
        includeMixed
      />
    </MainWrapper>
  );
};

export default NewMatchScreen;
