import React, { useMemo } from "react";
import { TextInput, View } from "react-native";
import { TextAreaProps } from "./TextArea.types";
import CustomText from "atoms/CustomText/CustomText.component";
import { WidgetWrapper } from "molecules/index";
import { useThemeContext } from "contexts";
import styles from "./TextArea.styles";

const TextArea = ({
  label,
  overrideStyle,
  overrideWrapperStyle,
  ...props
}: TextAreaProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);

  return (
    <View style={overrideStyle}>
      {label && <CustomText text={label} overrideStyle={themedStyles.label} />}
      <WidgetWrapper
        disabled
        overrideStyle={[themedStyles.container, overrideWrapperStyle]}
      >
        <TextInput
          {...props}
          multiline
          style={themedStyles.input}
          placeholderTextColor={colors.GRAYISH_BLUE}
        />
        {props.maxLength && (
          <View style={themedStyles.counterContainer}>
            <CustomText
              font="headline3"
              weight="regular"
              overrideStyle={themedStyles.counter}
              text={`${props.value?.length ?? 0}/${props.maxLength}`}
            />
          </View>
        )}
      </WidgetWrapper>
    </View>
  );
};

export default TextArea;
