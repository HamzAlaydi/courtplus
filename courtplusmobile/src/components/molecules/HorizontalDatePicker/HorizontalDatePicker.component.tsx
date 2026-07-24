import React, { useCallback, useRef, useState } from "react";
import { HorizontalDatePickerProps } from "./HorizontalDatePicker.types";
import {
  currentDate,
  formatDate,
  generateWeek,
  generateWeeks,
  width as SCREEN_WIDTH,
  VISIBLE_WEEKS_AROUND,
  WEEKS_BATCH,
} from "utils";
import { CustomText, DayCell } from "atoms/index";
import { FlatList, View, ViewToken } from "react-native";
import { addDays, isSameDay } from "date-fns";
import styles from "./HorizontalDatePicker.styles";

const HorizontalDatePicker = ({
  onDayPress,
  overrideContainerStyle,
  selectedDate,
}: HorizontalDatePickerProps) => {
  const [weeks, setWeeks] = useState<Date[][]>(() =>
    generateWeeks(currentDate)
  );
  const [centerIndex, setCenterIndex] = useState<number>(VISIBLE_WEEKS_AROUND);
  const listRef = useRef<FlatList<Date[]>>(null);

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
        <View style={styles.week}>
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
    [selectedDate]
  );

  return (
    <View style={overrideContainerStyle}>
      <CustomText
        text={formatDate(selectedDate.toString(), "MMMM yyyy")}
        font="bottomSheetTitle"
        weight="bold"
        overrideStyle={styles.title}
      />
      <FlatList
        ref={listRef}
        data={weeks}
        horizontal
        pagingEnabled
        initialScrollIndex={centerIndex}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        renderItem={renderWeek}
        keyExtractor={(_, index) => `week-${index}`}
        onViewableItemsChanged={onScrollEnd}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        showsHorizontalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

export default HorizontalDatePicker;
