import { useCallback, useEffect, useRef } from "react";
import {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  ReduceMotion,
} from "react-native-reanimated";

/** Motion timings (ms) of the new look. */
export const MOTION = {
  /** Press-in scale-down. */
  press: 120,
  /** Colour and state changes. */
  state: 180,
  /** Toggles and bottom sheets. */
  sheet: 220,
  /** List and card entering. */
  enter: 260,
  /** Delay between consecutive list items. */
  stagger: 40,
  /** Items after this index enter together instead of waiting longer. */
  maxStaggerIndex: 8,
  /** Distance (px) items rise or drop while fading in. */
  rise: 10,
  /** Scale a tappable shrinks to while pressed. */
  pressScale: 0.96,
} as const;

/** Spring used to release a pressed tappable. */
export const PRESS_SPRING = {
  damping: 15,
  stiffness: 320,
  mass: 0.6,
  reduceMotion: ReduceMotion.System,
} as const;

/** Spring used by toggles, segmented controls and sheets (~220 ms). */
export const TOGGLE_SPRING = {
  damping: 20,
  stiffness: 260,
  mass: 0.8,
  overshootClamping: false,
  reduceMotion: ReduceMotion.System,
} as const;

/** Timing used for colour and state changes (~180 ms). */
export const STATE_TIMING = {
  duration: MOTION.state,
  easing: Easing.out(Easing.quad),
  reduceMotion: ReduceMotion.System,
} as const;

const staggerDelay = (index: number) =>
  Math.min(Math.max(index, 0), MOTION.maxStaggerIndex) * MOTION.stagger;

/**
 * Fade in while rising ~10px, staggered 40ms by index (capped).
 * Use on list items and cards: `<Animated.View entering={enterRise(index)}>`.
 */
export const enterRise = (index = 0) =>
  FadeInUp.duration(MOTION.enter)
    .delay(staggerDelay(index))
    .easing(Easing.out(Easing.cubic))
    .withInitialValues({ opacity: 0, transform: [{ translateY: MOTION.rise }] })
    .reduceMotion(ReduceMotion.System);

/** Fade in while dropping ~10px. Use on headers and content above the fold. */
export const enterDrop = (index = 0) =>
  FadeInDown.duration(MOTION.enter)
    .delay(staggerDelay(index))
    .easing(Easing.out(Easing.cubic))
    .withInitialValues({
      opacity: 0,
      transform: [{ translateY: -MOTION.rise }],
    })
    .reduceMotion(ReduceMotion.System);

/** Plain fade in, staggered by index. */
export const enterFade = (index = 0) =>
  FadeIn.duration(MOTION.state)
    .delay(staggerDelay(index))
    .reduceMotion(ReduceMotion.System);

/** Short fade out for items leaving the screen. */
export const exitFade = () =>
  FadeOut.duration(MOTION.state).reduceMotion(ReduceMotion.System);

/**
 * Returns an `entering` builder for list items that only animates during the
 * screen's first render pass. Items mounted later (scrolling, pagination,
 * recycling) appear without animation.
 *
 * const entering = useListEntering();
 * renderItem={({ item, index }) => (
 *   <Animated.View entering={entering(index)}>...</Animated.View>
 * )}
 */
export const useListEntering = (windowMs = 700) => {
  const isFirstPass = useRef(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      isFirstPass.current = false;
    }, windowMs);
    return () => clearTimeout(timer);
  }, [windowMs]);

  return useCallback(
    (index: number) => (isFirstPass.current ? enterRise(index) : undefined),
    []
  );
};
