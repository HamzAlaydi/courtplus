import { User } from "models";

export type AddPlayersModalProps = {
  onClose: () => void;
  onAddPlayer: (player: User) => void;
  participants: User[];
};
