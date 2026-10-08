import { User } from "models";
import { StyleProp, ViewStyle } from "react-native";

export type ProfileStat = {
  value: string;
  label: string;
};

export type ProfileImageHeaderProps = {
  overrideStyle?: StyleProp<ViewStyle>;
  user: User | null;
  showFollowersAndFollowing?: boolean;
  showUpdateButton?: boolean;
  isVisitingOtherProfile?: boolean;
  isUpdating?: boolean;
  isCompleteProfile?: boolean;
  /** Identity block (name, username, bio) shown under the avatar. */
  children?: React.ReactNode;
  /** Extra tiles appended to the following / followers stats card. */
  stats?: ProfileStat[];
};
