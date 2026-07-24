import { ImagePickerModal, MetricRow, ProfileImage } from "molecules/index";
import React from "react";
import { Image, ImageBackground, TouchableOpacity, View } from "react-native";
import { Images } from "theme";
import styles from "./ProfileImageHeader.styles";
import { IconButton } from "atoms/index";
import { ProfileImageHeaderProps } from "./ProfileImageHeader.types";
import { useTranslation } from "react-i18next";
import { useProfileImageHeader } from "./ProfileImageHeader.logic";

const ProfileImageHeader = ({
  overrideStyle,
  user,
  showFollowersAndFollowing = true,
  showUpdateButton = true,
  isVisitingOtherProfile = false,
  isUpdating = false,
  isCompleteProfile = false,
}: ProfileImageHeaderProps) => {
  const { t } = useTranslation();
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
        <IconButton
          overrideStyle={styles.button}
          icon={user?.isFollowing ? Images.unfollow : Images.follow}
          title={
            user?.isFollowing ? t("profile.unfollow") : t("profile.follow")
          }
          onPress={user?.isFollowing ? onUnfollow : onFollow}
        />
      );
    }
    if (showUpdateButton) {
      return (
        <IconButton
          overrideStyle={styles.button}
          icon={Images.edit}
          title={t("general.update")}
          onPress={onUpdatePress}
        />
      );
    }
  };

  return (
    <View style={[overrideStyle]}>
      <ImageBackground
        source={user?.coverUrl ? { uri: user.coverUrl } : Images.cover}
        style={styles.image}
        imageStyle={styles.imageStyle}
      >
        {isUpdating && (
          <TouchableOpacity
            onPress={() => onPickerPress("coverAssetId")}
            style={styles.cameraContainer}
          >
            <Image source={Images.addPhoto} />
          </TouchableOpacity>
        )}
        <View style={styles.imageContent}>
          <View style={styles.rowContainer}>
            <ProfileImage
              showCamera={isUpdating}
              onPress={() => onPickerPress("avatarAssetId")}
              overrideStyle={styles.profile}
              image={user?.avatarUrl}
            />
            {renderButton()}
          </View>
        </View>
      </ImageBackground>
      {showFollowersAndFollowing && (
        <MetricRow
          leftValue={`${user?.followingCount} ${t("profile.following")}`}
          rightValue={`${user?.followersCount} ${t("profile.followers")}`}
          overrideStyle={styles.metric}
          onLeftValuePress={() => onFollowersPress(false)}
          onRightValuePress={() => onFollowersPress(true)}
        />
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
