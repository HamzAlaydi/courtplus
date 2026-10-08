import React, { useMemo } from "react";
import Video from "react-native-video";
import { useThemeContext } from "contexts";
import styles from "./VideoPlayer.styles";
import { VideoPlayerProps } from "./VideoPlayer.types";

/**
 * Tappable video player for court/branch media assets. Starts paused and
 * shows the native player controls on tap (play/pause, seek, fullscreen).
 */
const VideoPlayer = ({ source, overrideStyle }: VideoPlayerProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);

  return (
    <Video
      source={{ uri: source }}
      style={[themedStyles.video, overrideStyle]}
      controls
      paused
      resizeMode="cover"
    />
  );
};

export default VideoPlayer;
