import { useThemeContext } from "contexts";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Dimensions,
  FlatList,
  LayoutChangeEvent,
  View,
  ViewToken,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import styles, { DOT_SIZE, ACTIVE_DOT_WIDTH } from "./Carousel.styles";
import { CarouselMedia, CarouselProps } from "./Carousel.types";
import { CachedImage } from "molecules/index";
import VideoPlayer from "../VideoPlayer/VideoPlayer.component";
import { STATE_TIMING } from "utils";

const { width: screenWidth } = Dimensions.get("window");

type DotProps = {
  isActive: boolean;
  themedStyles: ReturnType<typeof styles>;
};

const PaginationDot = ({ isActive, themedStyles }: DotProps) => {
  const animatedStyle = useAnimatedStyle(
    () => ({
      width: withTiming(isActive ? ACTIVE_DOT_WIDTH : DOT_SIZE, STATE_TIMING),
      opacity: withTiming(isActive ? 1 : 0.6, STATE_TIMING),
    }),
    [isActive]
  );

  return (
    <Animated.View
      style={[
        themedStyles.dot,
        isActive && themedStyles.activeDot,
        animatedStyle,
      ]}
    />
  );
};

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
  const [itemWidth, setItemWidth] = useState(screenWidth);
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

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0) {
      setItemWidth(width);
    }
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: CarouselMedia; index: number }) => (
      <View style={[themedStyles.imageContainer, { width: itemWidth }]}>
        {item.isVideo ? (
          <VideoPlayer source={item.url} overrideStyle={themedStyles.image} />
        ) : (
          <CachedImage source={item.url} overrideStyle={themedStyles.image} />
        )}
      </View>
    ),
    [themedStyles.imageContainer, themedStyles.image, itemWidth]
  );

  const keyExtractor = useCallback(
    (_item: CarouselMedia, index: number) => `carousel-media-${index}`,
    []
  );

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <View style={[themedStyles.container, overrideStyle]} onLayout={onLayout}>
      <FlatList
        ref={flatListRef}
        data={images}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        extraData={itemWidth}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        snapToInterval={itemWidth}
        snapToAlignment="center"
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: itemWidth,
          offset: itemWidth * index,
          index,
        })}
      />
      {showPagination && images.length > 1 && (
        <View style={themedStyles.paginationContainer} pointerEvents="none">
          <View style={themedStyles.pagination}>
            {images.map((_, index) => (
              <PaginationDot
                key={`dot-${index}`}
                isActive={index === activeIndex}
                themedStyles={themedStyles}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

export default Carousel;
