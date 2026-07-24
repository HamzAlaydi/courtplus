import { Notification } from "models";
import { StyleProp, ViewStyle } from "react-native";

export type NotificationItemProps = {
  item: Notification;
  overrideStyle?: StyleProp<ViewStyle>;
};

export type NotificationMapperProps = {
  onAccept: () => void;
  onFollow: () => void;
};
