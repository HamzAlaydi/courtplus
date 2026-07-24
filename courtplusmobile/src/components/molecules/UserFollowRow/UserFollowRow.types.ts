export type UserFollowRowProps = {
  name: string;
  username: string;
  image: string;
  onPress: () => void;
  gender: string;
  isFollowing: boolean;
  isFollowed: boolean;
  onFollow: () => void;
  onUnfollow: () => void;
  showButton?: boolean;
};
