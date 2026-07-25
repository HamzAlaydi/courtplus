import React from "react";
import Video from "react-native-video";
import { VideoPlayerProps } from "./VideoPlayer.types";

/**
 * Tappable video player for court/branch media assets. Starts paused and
 * shows the native player controls on tap (play/pause, seek, fullscreen).
 */
const VideoPlayer = ({ source, overrideStyle }: VideoPlayerProps) => {
  return (
    <Video
      source={{ uri: source }}
      style={overrideStyle}
      controls
      paused
      resizeMode="cover"
    />
  );
};

export default VideoPlayer;
