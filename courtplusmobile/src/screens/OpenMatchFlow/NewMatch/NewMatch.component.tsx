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
import { Images } from "theme";
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
      whiteBackground
      scrollEnabled
      overrideContentStyle={themedStyles.scrollContent}
    >
      <Header whiteColor title={t("openMatch.newMatch")} />
      <View style={themedStyles.content}>
        <View style={themedStyles.rowContainer}>
          <CustomText
            text={t("openMatch.selectGame")}
            font="chip"
            weight="semiBold"
          />
          <SportChips
            overrideScrollStyle={themedStyles.sportsScroll}
            overrideStyle={themedStyles.sports}
            withAllSports={false}
            withViewWrapper={false}
            onSportPress={setSelectedSport}
          />
        </View>
        <View style={[themedStyles.rowContainer, themedStyles.margin]}>
          <CustomText
            font="chip"
            weight="semiBold"
            text={t("openMatch.gameType")}
          />
          <View style={themedStyles.gameContainer}>
            {matchSizes.map((item) => (
              <Chip
                key={item.key}
                isSelected={item.key === playerAside?.key}
                title={item.title}
                onPress={() => setPlayerAside(item)}
                overrideStyle={themedStyles.gameChip}
              />
            ))}
          </View>
        </View>
        <WidgetWrapper disabled overrideStyle={themedStyles.playersContainer}>
          <CustomText
            font="chip"
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
        </WidgetWrapper>
        {showPlayersButton && (
          <CustomText
            text={t("openMatch.addPlayers")}
            font="headline3"
            weight="medium"
            onPress={onOpenAddPlayersModal}
            overrideStyle={themedStyles.addPlayersText}
          />
        )}
        <ListActionItem
          showSeparator
          overrideContainerStyle={themedStyles.list}
          list={list}
          overrideImageStyle={themedStyles.listImage}
        />
        <View style={themedStyles.memberContainer}>
          <Image source={Images.lock} />
          <CustomText
            font="headline3"
            weight="medium"
            text={t("openMatch.membersAccepted")}
            overrideStyle={themedStyles.memberText}
          />
          <CustomSwitch
            value={requiresApproval}
            onValueChange={setRequiresApproval}
            overrideStyle={themedStyles.switch}
          />
          <Image source={Images.info} style={themedStyles.info} />
        </View>
        <View style={themedStyles.bottomContainer}>
          <CustomButton
            title={t("openMatch.Create Match")}
            variant={isCreteMatchButtonDisabled ? "disabledDark" : "dark"}
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
