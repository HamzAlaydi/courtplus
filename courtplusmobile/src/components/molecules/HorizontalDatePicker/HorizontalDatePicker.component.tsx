import React, { useCallback, useMemo, useRef, useState } from "react";
import { HorizontalDatePickerProps } from "./HorizontalDatePicker.types";
import {
  currentDate,
  formatDate,
  generateWeek,
  generateWeeks,
  VISIBLE_WEEKS_AROUND,
  WEEKS_BATCH,
} from "utils";
import { CustomText, DayCell } from "atoms/index";
import { FlatList, LayoutChangeEvent, View, ViewToken } from "react-native";
import { addDays, isSameDay } from "date-fns";
import { useThemeContext } from "contexts";
import styles from "./HorizontalDatePicker.styles";

const HorizontalDatePicker = ({
  onDayPress,
  overrideContainerStyle,
  selectedDate,
}: HorizontalDatePickerProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const [weeks, setWeeks] = useState<Date[][]>(() =>
    generateWeeks(currentDate)
  );
  const [centerIndex, setCenterIndex] = useState<number>(VISIBLE_WEEKS_AROUND);
  const [pageWidth, setPageWidth] = useState(0);
  const listRef = useRef<FlatList<Date[]>>(null);

  const onListLayout = (event: LayoutChangeEvent) => {
    const nextWidth = Math.round(event.nativeEvent.layout.width);
    if (nextWidth > 0 && nextWidth !== pageWidth) {
      setPageWidth(nextWidth);
    }
  };

  const prependWeeks = useCallback(() => {
    const firstWeekStart = weeks[0][0];
    const newWeeks = Array.from({ length: WEEKS_BATCH }, (_, i) =>
      generateWeek(addDays(firstWeekStart, -(i + 1) * 7, {}))
    ).reverse();
    setWeeks((prev) => [...newWeeks, ...prev]);
    setCenterIndex((prev) => prev + WEEKS_BATCH);
    listRef.current?.scrollToIndex({ index: WEEKS_BATCH, animated: false });
  }, [weeks]);

  const appendWeeks = useCallback(() => {
    const lastWeekStart = weeks[weeks.length - 1][0];
    const newWeeks = Array.from({ length: WEEKS_BATCH }, (_, i) =>
      generateWeek(addDays(lastWeekStart, (i + 1) * 7))
    );
    setWeeks((prev) => [...prev, ...newWeeks]);
  }, [weeks]);

  const onScrollEnd = ({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const firstVisibleIndex = viewableItems[0]?.index ?? 0;
    if (firstVisibleIndex <= 1) prependWeeks();
    if (firstVisibleIndex >= weeks.length - 2) appendWeeks();
  };

  const onDayPressHandler = (date: Date) => {
    onDayPress(date);
  };

  const renderWeek = useCallback(
    ({ item }: { item: Date[] }) => {
      return (
        <View style={[themedStyles.week, { width: pageWidth }]}>
          {item.map((day) => {
            return (
              <DayCell
                key={day.toDateString()}
                day={day}
                isSelected={isSameDay(day, selectedDate)}
                onPress={() => onDayPressHandler(day)}
              />
            );
          })}
        </View>
      );
    },
    [selectedDate, pageWidth, themedStyles]
  );

  return (
    <View style={overrideContainerStyle}>
      <CustomText
        text={formatDate(selectedDate.toString(), "MMMM yyyy")}
        font="sectionTitle"
        weight="bold"
        overrideStyle={themedStyles.title}
      />
      <View style={themedStyles.listContainer} onLayout={onListLayout}>
        {pageWidth > 0 && (
          <FlatList
            ref={listRef}
            data={weeks}
            horizontal
            pagingEnabled
            initialScrollIndex={centerIndex}
            getItemLayout={(_, index) => ({
              length: pageWidth,
              offset: pageWidth * index,
              index,
            })}
            renderItem={renderWeek}
            keyExtractor={(_, index) => `week-${index}`}
            onViewableItemsChanged={onScrollEnd}
            viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
            showsHorizontalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
};

export default HorizontalDatePicker;
