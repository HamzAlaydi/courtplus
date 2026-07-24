import { CustomButton, CustomText } from "atoms/index";
import React from "react";
import { Image, View } from "react-native";
import { StatusViewProps } from "./StatusView.types";
import styles from "./StatusView.styles";

const StatusView = ({
  image,
  title,
  buttonTitle,
  onButtonPress,
  overrideStyle,
  secondImage,
}: StatusViewProps) => {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <View>
        <Image source={image} style={styles.image} />
        {secondImage && (
          <Image source={secondImage} style={styles.secondImage} />
        )}
      </View>

      <CustomText
        text={title}
        font="display"
        weight="bold"
        overrideStyle={styles.title}
      />
      <CustomButton
        variant="active"
        title={buttonTitle}
        onPress={onButtonPress}
        overrideStyle={styles.button}
      />
    </View>
  );
};

export default StatusView;
