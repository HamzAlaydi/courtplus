import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { verticalScale } from "utils";
import { BottomSheetOverlayProps } from "./BottomSheetOverlay.types";
import { useThemeContext } from "contexts";
import styles from "./BottomSheetOverlay.styles";
import { Image, View } from "react-native";
import { Images } from "theme";
import { CustomText, PressableScale } from "atoms/index";
import { BottomSheetMethods } from "@gorhom/bottom-sheet/lib/typescript/types";

const BottomSheetOverlay = forwardRef<
  BottomSheetMethods,
  BottomSheetOverlayProps
>(
  (
    {
      children,
      title,
      isWhite = false,
      overrideContentStyle,
      disableScroll = false,
      snapPoints,
      onDismiss,
      keyboardBlurBehavior = "restore",
    },
    ref
  ) => {
    const {
      currentTheme: { colors },
    } = useThemeContext();
    const themedStyles = useMemo(
      () => styles(colors, isWhite),
      [colors, isWhite]
    );
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);

    const handleSheetChanges = (index: number) => {};

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          enableTouchThrough={false}
          opacity={0.55}
          style={[props.style, themedStyles.backdrop]}
        />
      ),
      [themedStyles]
    );

    const handleClose = useCallback(() => {
      bottomSheetModalRef.current?.close();
    }, []);

    useImperativeHandle(ref, () => ({
      dismiss: () => {
        onDismiss?.();
        bottomSheetModalRef.current?.dismiss();
      },
      snapToIndex: (index: number) => {
        bottomSheetModalRef.current?.snapToIndex(index);
      },
      snapToPosition: (position: number | string) => {
        bottomSheetModalRef.current?.snapToPosition(position);
      },
      expand: () => {
        bottomSheetModalRef.current?.expand();
      },
      collapse: () => {
        bottomSheetModalRef.current?.collapse();
      },
      close: () => {
        bottomSheetModalRef.current?.close();
      },
      present: () => {
        bottomSheetModalRef.current?.present();
      },
      forceClose: () => {
        bottomSheetModalRef.current?.close();
      },
    }));

    const Wrapper = disableScroll ? BottomSheetView : BottomSheetScrollView;

    return (
      <BottomSheetModal
        enableDynamicSizing
        ref={bottomSheetModalRef}
        index={0}
        onDismiss={onDismiss}
        snapPoints={snapPoints}
        maxDynamicContentSize={verticalScale(650)}
        onChange={handleSheetChanges}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        keyboardBehavior="interactive"
        keyboardBlurBehavior={keyboardBlurBehavior}
        handleStyle={themedStyles.handle}
        handleIndicatorStyle={themedStyles.handleIndicator}
        backgroundStyle={themedStyles.modal}
      >
        <Wrapper
          showsVerticalScrollIndicator={false}
          style={disableScroll && themedStyles.wrapper}
          contentContainerStyle={[themedStyles.container, overrideContentStyle]}
        >
          {title && (
            <View style={themedStyles.closeButtonContainer}>
              <CustomText
                text={title}
                font="screenTitle"
                weight="extraBold"
                accessibilityRole="header"
                overrideStyle={themedStyles.title}
              />

              <PressableScale
                style={themedStyles.closeButton}
                onPress={handleClose}
                hitSlop={6}
                accessibilityRole="button"
              >
                <Image source={Images.close} style={themedStyles.closeIcon} />
              </PressableScale>
            </View>
          )}
          {children}
        </Wrapper>
      </BottomSheetModal>
    );
  }
);

export default BottomSheetOverlay;
