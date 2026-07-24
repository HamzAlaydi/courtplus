import { useThemeContext } from "contexts";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Dimensions, FlatList, View, ViewToken } from "react-native";
import styles from "./Carousel.styles";
import { CarouselProps } from "./Carousel.types";
import { CachedImage } from "molecules/index";

const { width: screenWidth } = Dimensions.get("window");

const Carousel = ({
  images,
  overrideStyle,
  autoPlay = false,
  autoPlayInterval = 3000,
  onImagePress,
  showPagination = true,
}: CarouselProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const onViewableItemsChanged = useRef(
    ({
      viewableItems,
    }: {
      viewableItems: ViewToken[];
      changed: ViewToken[];
    }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
  }).current;

  useEffect(() => {
    if (autoPlay && images.length > 1) {
      autoPlayTimerRef.current = setInterval(() => {
        setActiveIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % images.length;
          flatListRef.current?.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
          return nextIndex;
        });
      }, autoPlayInterval);

      return () => {
        if (autoPlayTimerRef.current) {
          clearInterval(autoPlayTimerRef.current);
        }
      };
    }
  }, [autoPlay, autoPlayInterval, images.length]);

  const handleImagePress = useCallback(
    (index: number) => {
      onImagePress?.(index);
    },
    [onImagePress]
  );

  const renderItem = useCallback(
    ({ item }: { item: string; index: number }) => (
      <View style={themedStyles.imageContainer}>
        <CachedImage source={item} overrideStyle={themedStyles.image} />
      </View>
    ),
    [themedStyles.imageContainer, themedStyles.image]
  );

  const keyExtractor = useCallback(
    (_item: string, index: number) => `carousel-image-${index}`,
    []
  );

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <View style={[themedStyles.container, overrideStyle]}>
      <FlatList
        ref={flatListRef}
        data={images}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        snapToInterval={screenWidth}
        snapToAlignment="center"
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
      />
      {showPagination && images.length > 1 && (
        <View style={themedStyles.paginationContainer}>
          {images.map((_, index) => (
            <View
              key={`dot-${index}`}
              style={[
                themedStyles.dot,
                index === activeIndex && themedStyles.activeDot,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default Carousel;
