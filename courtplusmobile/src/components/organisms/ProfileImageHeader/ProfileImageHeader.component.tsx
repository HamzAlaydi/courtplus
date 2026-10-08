import { ImagePickerModal, ProfileImage } from "molecules/index";
import React, { Fragment, useMemo } from "react";
import { Image, ImageBackground, View } from "react-native";
import { Images } from "theme";
import styles from "./ProfileImageHeader.styles";
import { CustomButton, CustomText, PressableScale } from "atoms/index";
import { ProfileImageHeaderProps } from "./ProfileImageHeader.types";
import { useTranslation } from "react-i18next";
import { useProfileImageHeader } from "./ProfileImageHeader.logic";
import { useThemeContext } from "contexts";
import { formatNumber } from "utils";

type StatItem = {
  key: string;
  value: string;
  label: string;
  onPress?: () => void;
};

const ProfileImageHeader = ({
  overrideStyle,
  user,
  showFollowersAndFollowing = true,
  showUpdateButton = true,
  isVisitingOtherProfile = false,
  isUpdating = false,
  isCompleteProfile = false,
  children,
  stats,
}: ProfileImageHeaderProps) => {
  const { t } = useTranslation();
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const {
    onFollow,
    onUnfollow,
    navigate,
    onFollowersPress,
    imagePickerModalRef,
    onPickerPress,
    onImageSelected,
    onClose,
  } = useProfileImageHeader(user?.id ?? "", isCompleteProfile);

  const onUpdatePress = () => {
    navigate("ProfileStack", {
      screen: "UpdateProfile",
      params: {
        user: user!!,
      },
    });
  };

  const renderButton = () => {
    if (isVisitingOtherProfile) {
      return (
        <CustomButton
          size="small"
          variant={user?.isFollowing ? "outline" : "primary"}
          overrideStyle={themedStyles.button}
          leftIcon={
            <Image
              source={user?.isFollowing ? Images.unfollow : Images.follow}
              style={themedStyles.buttonIcon}
            />
          }
          title={
            user?.isFollowing ? t("profile.unfollow") : t("profile.follow")
          }
          onPress={user?.isFollowing ? onUnfollow : onFollow}
        />
      );
    }
    if (showUpdateButton) {
      return (
        <CustomButton
          size="small"
          variant="outline"
          overrideStyle={themedStyles.button}
          leftIcon={
            <Image source={Images.edit} style={themedStyles.buttonIcon} />
          }
          title={t("general.update")}
          onPress={onUpdatePress}
        />
      );
    }
    return null;
  };

  const statItems: StatItem[] = [
    ...(showFollowersAndFollowing
      ? [
          {
            key: "following",
            value: formatNumber(user?.followingCount ?? 0),
            label: t("profile.following"),
            onPress: () => onFollowersPress(false),
          },
          {
            key: "followers",
            value: formatNumber(user?.followersCount ?? 0),
            label: t("profile.followers"),
            onPress: () => onFollowersPress(true),
          },
        ]
      : []),
    ...(stats ?? []).map((stat, index) => ({
      key: `stat-${index}`,
      ...stat,
    })),
  ];

  const button = renderButton();
  const showBody = !!button || !!children || statItems.length > 0;

  const renderStat = (item: StatItem) => {
    const content = (
      <>
        <CustomText
          text={item.value}
          font="displayNumber"
          weight="bold"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          overrideStyle={themedStyles.statValue}
        />
        <CustomText
          text={item.label}
          font="caption"
          weight="medium"
          numberOfLines={2}
          overrideStyle={themedStyles.statLabel}
        />
      </>
    );
    if (item.onPress) {
      return (
        <PressableScale
          onPress={item.onPress}
          accessibilityRole="button"
          style={themedStyles.statCell}
        >
          {content}
        </PressableScale>
      );
    }
    return <View style={themedStyles.statCell}>{content}</View>;
  };

  return (
    <View style={[overrideStyle]}>
      <View style={themedStyles.coverWrapper}>
        <ImageBackground
          source={user?.coverUrl ? { uri: user.coverUrl } : Images.cover}
          style={themedStyles.image}
          imageStyle={themedStyles.imageStyle}
        >
          {isUpdating && (
            <View style={themedStyles.cameraOverlay}>
              <PressableScale
                onPress={() => onPickerPress("coverAssetId")}
                accessibilityRole="button"
                style={themedStyles.cameraContainer}
              >
                <Image
                  source={Images.addPhoto}
                  style={themedStyles.cameraIcon}
                />
              </PressableScale>
            </View>
          )}
        </ImageBackground>
        <ProfileImage
          showCamera={isUpdating}
          onPress={() => onPickerPress("avatarAssetId")}
          overrideStyle={themedStyles.profile}
          image={user?.avatarUrl}
        />
      </View>
      {showBody && (
        <View pointerEvents="box-none" style={themedStyles.actionRow}>
          {button}
        </View>
      )}
      {children}
      {statItems.length > 0 && (
        <View style={themedStyles.statsCard}>
          {statItems.map((item, index) => (
            <Fragment key={item.key}>
              {index > 0 && <View style={themedStyles.statDivider} />}
              {renderStat(item)}
            </Fragment>
          ))}
        </View>
      )}
      <ImagePickerModal
        ref={imagePickerModalRef}
        onClose={onClose}
        onImageSelected={onImageSelected}
      />
    </View>
  );
};

export default ProfileImageHeader;
