import { Booking, Participant } from "models";
import { StyleProp, ViewStyle } from "react-native";

export type MatchInvitationCardProps = {
  item: Booking;
  participant: Participant;
  onPress: () => void;
  overrideStyle?: StyleProp<ViewStyle>;
};
