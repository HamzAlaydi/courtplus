import { BottomSheetModal, BottomSheetTextInput } from "@gorhom/bottom-sheet";
import BottomSheetOverlay from "molecules/BottomSheetOverlay/BottomSheetOverlay.component";
import { AvatarSlots, List } from "organisms/index";
import React, { forwardRef, useMemo, useRef } from "react";
import { Image, TextInput, View } from "react-native";
import { Images } from "theme";
import { useAddPlayersModal } from "./AddPlayersModal.logic";
import styles from "./AddPlayersModal.styles";
import { useThemeContext } from "contexts";
import { ListRenderItemInfo } from "@shopify/flash-list";
import { User } from "models";
import ProfileCard from "molecules/ProfileCard/ProfileCard.component";
import { AddPlayersModalProps } from "./AddPlayersModal.types";
import { CustomButton } from "atoms/index";
import { useTranslation } from "react-i18next";

const AddPlayersModal = forwardRef<BottomSheetModal, AddPlayersModalProps>(
  ({ onAddPlayer, participants, onClose }, ref) => {
    const {
      customersData,
      isLoading,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
      searchInput,
      setSearchInput,
    } = useAddPlayersModal();
    const {
      currentTheme: { colors },
    } = useThemeContext();
    const themedStyles = useMemo(() => styles(colors), [colors]);
    const { t } = useTranslation();

    const onContinuePress = () => {
      setSearchInput("");
      onClose();
    };

    const onPress = (item: User) => {
      onAddPlayer(item);
    };

    const renderItem = ({ item }: ListRenderItemInfo<User>) => {
      return (
        <ProfileCard
          gender={item.gender}
          name={item.firstName}
          username={item.username}
          image={item.avatarUrl ?? ""}
          onAddPress={() => onPress(item)}
        />
      );
    };

    return (
      <BottomSheetOverlay
        isWhite
        ref={ref}
        title={t("openMatch.addPlayers")}
        keyboardBlurBehavior="none"
      >
        <View style={themedStyles.slotsContainer}>
          <AvatarSlots
            showRemoveButton={false}
            slots={participants}
            showUsername={false}
          />
        </View>
        <View style={themedStyles.searchInputContainer}>
          <Image source={Images.search} />
          <BottomSheetTextInput
            placeholder={t("openMatch.playersNameEmailPhone")}
            value={searchInput}
            onChangeText={setSearchInput}
            style={themedStyles.input}
          />
        </View>
        <List
          data={customersData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          hasNextPage={hasNextPage}
          fetchNextPage={fetchNextPage}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
        />
        <View style={themedStyles.button}>
          <CustomButton
            title={t("general.continue")}
            onPress={onContinuePress}
            variant="dark"
          />
        </View>
      </BottomSheetOverlay>
    );
  }
);

export default AddPlayersModal;
