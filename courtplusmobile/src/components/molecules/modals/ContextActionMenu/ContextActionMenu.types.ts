import { ActionMenuItems } from "utils";

export type ContextActionMenuProps = {
  isVisible: boolean;
  onClose: () => void;
  items: ActionMenuItems;
};
