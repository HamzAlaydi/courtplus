import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
  useMemo,
} from "react";
import {
  TextInput,
  View,
  TouchableOpacity,
  Animated,
  Image,
} from "react-native";
import {
  FloatingInputProps,
  FloatingLabelInputRef,
} from "./FloatingInput.types";
import { useThemeContext } from "contexts";
import styles from "./FloatingInput.styles";
import CustomText from "atoms/CustomText/CustomText.component";
import { Images } from "theme";

const FloatingLabelInput = forwardRef<
  FloatingLabelInputRef,
  FloatingInputProps
>(
  (
    {
      label,
      value,
      onChangeText,
      errorText,
      overrideStyle,
      autoFocus = true,
      onFocus,
      onBlur,
      leftComponent,
      showContent = false,
      greyBackground = false,
      ...props
    },
    ref
  ) => {
    const inputRef = useRef<TextInput>(null);
    const {
      currentTheme: { colors },
    } = useThemeContext();
    const themedStyles = useMemo(
      () => styles(colors, greyBackground),
      [colors, greyBackground]
    );
    const [showIcon, setShowIcon] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const animatedValue = useRef(new Animated.Value(1)).current;

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      clear: () => {
        onChangeText?.("");
      },
      isFocused: () => !!inputRef.current?.isFocused?.(),
    }));

    const onLabelPress = () => {
      inputRef.current?.focus();
    };

    const moveTextTop = () => {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    };

    const moveTextBottom = () => {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    };

    const onFocusHandler = () => {
      if (!showContent) {
        moveTextTop();
      }
      onFocus?.();
      onHideIcon();
      setIsFocused(true);
    };

    const onBlurHandler = () => {
      if (!showContent && !value) {
        moveTextBottom();
      }
      onBlur?.();
      onShowIcon();
      setIsFocused(false);
    };

    const labelStyle = {
      transform: [
        {
          translateY: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [13, 0],
          }),
        },
      ],
      fontSize: animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [16, 12],
        extrapolate: "clamp",
      }),
    };

    const onHideIcon = () => setShowIcon(false);

    const onShowIcon = () => setShowIcon(true);

    useEffect(() => {
      if (!value && !showContent) {
        moveTextBottom();
      } else {
        moveTextTop();
      }
    }, [value]);

    useEffect(() => {
      if (showContent) {
        moveTextTop();
      }
    }, [showContent]);

    return (
      <View style={[overrideStyle]}>
        <View
          style={[
            themedStyles.container,
            isFocused && themedStyles.focusedContainer,
            !!errorText && themedStyles.errorContainer,
          ]}
        >
          <View style={themedStyles.inputWrapper}>
            <TouchableOpacity onPress={onLabelPress}>
              <Animated.Text
                style={[themedStyles.label, labelStyle]}
                numberOfLines={1}
              >
                {label}
              </Animated.Text>
            </TouchableOpacity>
            <View style={themedStyles.inputContainer}>
              {leftComponent &&
                (isFocused || value || showContent) &&
                leftComponent}
              <TextInput
                ref={inputRef}
                style={themedStyles.input}
                autoFocus={autoFocus}
                value={value}
                onChangeText={onChangeText}
                onFocus={onFocusHandler}
                onBlur={onBlurHandler}
                selectionColor={greyBackground ? colors.INK : colors.LIME}
                {...props}
              />
            </View>
          </View>
          {showIcon && (
            <Image
              source={!value || errorText ? Images.error : Images.done}
              style={themedStyles.icon}
            />
          )}
        </View>

        {errorText && (
          <CustomText
            text={errorText}
            font="text"
            weight="regular"
            overrideStyle={themedStyles.error}
          />
        )}
      </View>
    );
  }
);

export default FloatingLabelInput;
