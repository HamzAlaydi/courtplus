import React, { useMemo } from "react";
import { Image, TouchableOpacity, View } from "react-native";
import { PostViewProps } from "./PostView.types";
import { Card, CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import styles from "./PostView.styles";
import { Images } from "theme";
import { formatDistanceToNow } from "date-fns";
import { formatNumber, formatTime, isRTL } from "utils";
import { CachedImage } from "molecules/index";

const PostView = ({ post, overrideStyle }: PostViewProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);

  const formattedDays = formatTime(post.createdAt);

  return (
    <Card disabled overrideStyle={[themedStyles.container, overrideStyle]}>
      <View style={themedStyles.headerContainer}>
        <CustomText
          numberOfLines={1}
          overrideStyle={themedStyles.body}
          text={post.body}
        />
        <CustomText
          font="chip"
          weight="regular"
          overrideStyle={themedStyles.days}
          text={formattedDays}
        />
      </View>
      <CachedImage
        source={post.assetUrl}
        overrideStyle={[themedStyles.imageBackground, themedStyles.image]}
      >
        <View style={themedStyles.imageOverlay}>
          <View style={themedStyles.likesCount}>
            <Image source={Images.likes} style={themedStyles.likeIcon} />
            <CustomText
              overrideStyle={themedStyles.counts}
              text={formatNumber(post.likesCount)}
              font="chip"
              weight="semiBold"
            />
          </View>
          <View style={themedStyles.likeButton}>
            <TouchableOpacity>
              <Image
                source={post.isLiked ? Images.likes : Images.likeSettings}
                style={!post.isLiked && themedStyles.rightIcon}
              />
            </TouchableOpacity>
          </View>
        </View>
      </CachedImage>
    </Card>
  );
};

export default PostView;
