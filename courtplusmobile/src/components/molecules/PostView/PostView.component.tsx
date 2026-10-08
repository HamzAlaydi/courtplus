import React, { useMemo } from "react";
import { Image, View } from "react-native";
import { PostViewProps } from "./PostView.types";
import { Card, CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import styles from "./PostView.styles";
import { Images } from "theme";
import { formatNumber, formatTime, generateFullName } from "utils";
import { CachedImage } from "molecules/index";
import { Gender } from "models";

const PostView = ({ post, overrideStyle }: PostViewProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);

  const formattedDays = formatTime(post.createdAt);
  const author = post.user;
  const authorName = author
    ? generateFullName(author) || author.username || ""
    : "";
  const avatar = author?.avatarUrl
    ? { uri: author.avatarUrl }
    : author?.gender === Gender.FEMALE
    ? Images.femaleProfile
    : Images.maleProfile;

  return (
    <Card overrideStyle={[themedStyles.container, overrideStyle]}>
      <View style={themedStyles.headerContainer}>
        {!!author && <Image source={avatar} style={themedStyles.avatar} />}
        <View style={themedStyles.headerText}>
          {!!authorName && (
            <CustomText
              font="cardTitle"
              weight="semiBold"
              numberOfLines={1}
              text={authorName}
              overrideStyle={themedStyles.name}
            />
          )}
          <CustomText
            font="caption"
            weight="regular"
            numberOfLines={1}
            overrideStyle={themedStyles.days}
            text={formattedDays}
          />
        </View>
      </View>
      {!!post.body && (
        <CustomText
          font="headline3"
          weight="regular"
          numberOfLines={3}
          overrideStyle={themedStyles.body}
          text={post.body}
        />
      )}
      <CachedImage source={post.assetUrl} overrideStyle={themedStyles.image} />
      <View style={themedStyles.actionRow}>
        <View
          style={[
            themedStyles.likeButton,
            post.isLiked && themedStyles.likeButtonActive,
          ]}
        >
          <Image
            source={post.isLiked ? Images.heartFilled : Images.heart}
            style={themedStyles.likeIcon}
          />
        </View>
        <CustomText
          text={formatNumber(post.likesCount)}
          font="headline3"
          weight="semiBold"
          overrideStyle={themedStyles.counts}
        />
      </View>
    </Card>
  );
};

export default PostView;
