import { User } from "models";
import { StyleProp, ViewStyle } from "react-native";

export type ProfileImageHeaderProps = {
  overrideStyle?: StyleProp<ViewStyle>;
  user: User | null;
  showFollowersAndFollowing?: boolean;
  showUpdateButton?: boolean;
  isVisitingOtherProfile?: boolean;
  isUpdating?: boolean;
  isCompleteProfile?: boolean;
};
