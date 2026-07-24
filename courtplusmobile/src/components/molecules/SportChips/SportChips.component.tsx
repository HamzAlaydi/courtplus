import { Chip } from "atoms/index";
import { useThemeContext } from "contexts";
import React, { useMemo, useState } from "react";
import { Image, ScrollView, View } from "react-native";
import { SportFilterItem, sports } from "utils";
import styles from "./SportChips.styles";
import { Images } from "theme";
import { SportChipsProps } from "./SportChips.types";

const SportChips = ({
  overrideStyle,
  overrideScrollStyle,
  withAllSports = true,
  withViewWrapper = true,
  onSportPress,
  multipleSelection = false,
}: SportChipsProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const sportsList = useMemo(() => sports, []);
  const listWithoutAllSports = useMemo(
    () => sports.filter((sport) => sport.value !== "all_courts"),
    [sports]
  );
  const finalList = useMemo(
    () => (withAllSports ? sportsList : listWithoutAllSports),
    [withAllSports, sportsList, listWithoutAllSports]
  );
  const [selectedSport, setSelectedSport] = useState<SportFilterItem[]>([
    finalList[0],
  ]);

  const toggleMultipleSelection = (sport: SportFilterItem) => {
    if (sport.value === "all_courts") {
      return selectedSport.includes(finalList[0])
        ? [finalList[0]]
        : [finalList[0]];
    }

    let updated: SportFilterItem[] = [];

    if (selectedSport.includes(sport)) {
      updated = selectedSport.filter((item) => item !== sport);
    } else {
      updated = selectedSport
        .filter((item) => item !== finalList[0])
        .concat(sport);
    }

    if (updated.length === 0) {
      return [finalList[0]];
    }

    return updated;
  };

  const onChipPress = (sport: SportFilterItem) => {
    if (multipleSelection) {
      setSelectedSport(toggleMultipleSelection(sport));
      onSportPress?.(toggleMultipleSelection(sport));
    } else {
      setSelectedSport([sport]);
      onSportPress?.([sport]);
    }
  };

  const Wrapper = withViewWrapper ? View : React.Fragment;

  return (
    <Wrapper>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={overrideScrollStyle}
        contentContainerStyle={[themedStyles.container, overrideStyle]}
      >
        {finalList.map((sport) => {
          const isSportSelected = selectedSport.includes(sport);
          return (
            <Chip
              isSelected={isSportSelected}
              key={sport.value}
              title={sport.label}
              onPress={() => onChipPress(sport)}
              leftComponent={
                <View
                  style={[
                    themedStyles.iconContainer,
                    isSportSelected && themedStyles.selectedIconContainer,
                  ]}
                >
                  <Image
                    source={Images[sport.icon as keyof typeof Images]}
                    style={[
                      themedStyles.icon,
                      isSportSelected && themedStyles.selectedIcon,
                    ]}
                  />
                </View>
              }
            />
          );
        })}
      </ScrollView>
    </Wrapper>
  );
};

export default SportChips;
