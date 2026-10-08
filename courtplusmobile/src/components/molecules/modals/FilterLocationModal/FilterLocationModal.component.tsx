import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { CustomText, Input, Slider } from "atoms/index";
import BottomSheetOverlay from "molecules/BottomSheetOverlay/BottomSheetOverlay.component";
import React, { forwardRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Image, View } from "react-native";
import { Images } from "theme";
import MapView, { Circle, PROVIDER_GOOGLE } from "react-native-maps";
import { useThemeContext } from "contexts";
import styles from "./FilterLocationModal.styles";
import ButtonsRow from "molecules/ButtonsRow/ButtonsRow.component";
import { useFilterLocationModal } from "./FilterLocationModal.logic";

const FilterLocationModal = forwardRef<BottomSheetModal, {}>(({}, ref) => {
  const { t } = useTranslation();
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const {
    location,
    address,
    query,
    setQuery,
    onSearch,
    onValueChange,
    radius,
    onDone,
    onClear,
  } = useFilterLocationModal();

  return (
    <BottomSheetOverlay isWhite ref={ref} title={t("general.location")}>
      <View style={themedStyles.content}>
        <Input
          placeholder={t("general.search")}
          leftComponent={
            <Image source={Images.search} style={themedStyles.searchIcon} />
          }
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={onSearch}
          returnKeyType="search"
        />
        <View style={themedStyles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            region={{
              latitude: location?.lat ?? 0,
              longitude: location?.long ?? 0,
              latitudeDelta: Math.max(0.02, radius / 55),
              longitudeDelta: Math.max(0.02, radius / 55),
            }}
            loadingEnabled
            loadingIndicatorColor={colors.INK}
            loadingBackgroundColor={colors.GROUND}
            style={themedStyles.map}
            showsMyLocationButton
          >
            <Circle
              center={{
                latitude: location?.lat ?? 0,
                longitude: location?.long ?? 0,
              }}
              radius={radius * 1000}
              strokeWidth={2}
              strokeColor={`${colors.INK}B3`}
              fillColor={`${colors.LIME}47`}
            />
          </MapView>
        </View>
        <View style={themedStyles.locationContainer}>
          <Image source={Images.location} style={themedStyles.locationIcon} />
          <CustomText
            text={`${address} ${t("filters.changeable")}`}
            font="caption"
            weight="medium"
            numberOfLines={2}
            overrideStyle={themedStyles.locationText}
          />
        </View>
        <View style={themedStyles.radiusContainer}>
          <CustomText
            text={t("filters.radius")}
            font="sectionTitle"
            weight="small"
            accessibilityRole="header"
          />
          <View style={themedStyles.radiusBadge}>
            <CustomText
              text={`${radius} ${t("general.km")}`}
              font="headline3"
              weight="semiBold"
              overrideStyle={themedStyles.radiusText}
            />
          </View>
        </View>
        <Slider onValueChange={onValueChange} value={radius} />
        <ButtonsRow
          title={t("general.clear")}
          secondaryTitle={t("general.done")}
          onPress={onClear}
          onSecondaryPress={onDone}
          overrideStyle={themedStyles.buttonContainer}
        />
      </View>
    </BottomSheetOverlay>
  );
});

export default FilterLocationModal;
