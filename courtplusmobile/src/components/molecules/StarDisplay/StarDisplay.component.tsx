import React, { useMemo } from "react";
import StarRating from "react-native-star-rating-widget";
import { StarDisplayProps } from "./StarDisplay.types";
import { Images } from "theme";
import { Image } from "react-native";
import { useThemeContext } from "contexts";
import styles from "./StartDisplay.styles";

const StarDisplay = ({
  rating,
  onChange,
  overrideImageStyle,
}: StarDisplayProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);

  return (
    <StarRating
      rating={rating}
      maxStars={5}
      step="full"
      onChange={(rating: number) => onChange?.(rating)}
      starStyle={themedStyles.star}
      StarIconComponent={({ type }) => (
        <Image
          source={type === "empty" ? Images.emptyStar : Images.star}
          style={[
            type === "empty" ? themedStyles.empty : themedStyles.filled,
            overrideImageStyle,
          ]}
        />
      )}
    />
  );
};

export default StarDisplay;
