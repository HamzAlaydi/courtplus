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
import { useInviteFriend } from "./InviteFriend.logic";
import { ListRenderItemInfo } from "@shopify/flash-list";
import { User } from "models";
import Animated from "react-native-reanimated";
import { enterRise, useListEntering } from "utils";

const InviteFriendScreen = () => {
  const { t } = useTranslation();
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
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
  const entering = useListEntering();

  const renderItem = ({ item, index }: ListRenderItemInfo<User>) => {
    return (
      <Animated.View entering={entering(index)}>
        <ProfileCard
          name={item.firstName}
          username={item.username}
          image={item.avatarUrl ?? ""}
          onAddPress={() => onAddPress(item)}
          gender={item.gender}
          overrideStyle={themedStyles.profileCard}
        />
      </Animated.View>
    );
  };

  return (
    <MainWrapper>
      <Header whiteColor title={t("booking.title")} />
      <View style={themedStyles.content}>
        <Stepper flow={StepperFlow.Booking} currentStep={3} />
        <CustomText
          text={t("booking.inviteFriend")}
          font="sectionTitle"
          weight="bold"
          accessibilityRole="header"
          overrideStyle={themedStyles.title}
        />
        <Animated.View
          entering={enterRise(0)}
          style={themedStyles.slotsContainer}
        >
          <AvatarSlots slots={selectedFriends} onRemovePress={onRemovePress} />
        </Animated.View>

        <View style={themedStyles.searchGroup}>
          <Input
            leftComponent={
              <Image source={Images.search} style={themedStyles.searchIcon} />
            }
            placeholder={t("booking.findPlayer")}
            value={searchInput}
            onChangeText={setSearchInput}
          />
          <CustomText
            text={t("booking.findPlayerDescription")}
            font="caption"
            weight="regular"
            overrideStyle={themedStyles.description}
          />
        </View>
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
