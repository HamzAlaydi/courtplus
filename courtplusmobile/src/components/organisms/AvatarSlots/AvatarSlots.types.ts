import { User } from "models";

export type AvatarSlotsProps = {
  slots: User[];
  showUsername?: boolean;
  showRemoveButton?: boolean;
  onRemovePress?: (friend: User) => void;
};
