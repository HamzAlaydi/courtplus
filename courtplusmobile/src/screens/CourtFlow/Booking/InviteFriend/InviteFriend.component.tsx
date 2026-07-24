import { useThemeContext } from "contexts";
import {
  BookingButtons,
  Header,
  ProfileCard,
  Stepper,
  StepperFlow,
} from "molecules/index";
import { AvatarSlots, List, MainWrapper } from "organisms/index";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Image, View } from "react-native";
import styles from "./InviteFriend.styles";
import { CustomText, Input } from "atoms/index";
import { Images } from "theme";
import { CourtStackNavigationProp } from "navigation/types";
import { useNavigation } from "@react-navigation/native";
import { useInviteFriend } from "./InviteFriend.logic";
import { ListRenderItemInfo } from "@shopify/flash-list";
import { User } from "models";

const InviteFriendScreen = () => {
  const { t } = useTranslation();
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { navigate } = useNavigation<CourtStackNavigationProp>();
  const {
    customersData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    searchInput,
    setSearchInput,
    onAddPress,
    selectedFriends,
    onRemovePress,
    onCancelPress,
    onNextPress,
  } = useInviteFriend();

  const renderItem = ({ item }: ListRenderItemInfo<User>) => {
    return (
      <ProfileCard
        name={item.firstName}
        username={item.username}
        image={item.avatarUrl ?? ""}
        onAddPress={() => onAddPress(item)}
        gender={item.gender}
        overrideStyle={themedStyles.profileCard}
      />
    );
  };

  return (
    <MainWrapper whiteBackground>
      <Header whiteColor title={t("booking.title")} />
      <View style={themedStyles.content}>
        <Stepper flow={StepperFlow.Booking} currentStep={3} />
        <CustomText
          text={t("booking.inviteFriend")}
          font="headline3"
          weight="regular"
          overrideStyle={themedStyles.title}
        />
        <View style={themedStyles.slotsContainer}>
          <AvatarSlots slots={selectedFriends} onRemovePress={onRemovePress} />
        </View>

        <Input
          leftComponent={<Image source={Images.search} />}
          overrideStyle={themedStyles.input}
          placeholder={t("booking.findPlayer")}
          value={searchInput}
          onChangeText={setSearchInput}
        />
        <CustomText
          text={t("booking.findPlayerDescription")}
          font="chip"
          weight="regular"
          overrideStyle={themedStyles.description}
        />
      </View>
      <List
        data={customersData}
        renderItem={renderItem}
        isLoading={isFetching}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={themedStyles.listContent}
        ItemSeparatorComponent={() => <View style={themedStyles.separator} />}
      />
      <BookingButtons onCancelPress={onCancelPress} onNextPress={onNextPress} />
    </MainWrapper>
  );
};

export default InviteFriendScreen;
