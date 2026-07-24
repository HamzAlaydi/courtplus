export type SnackbarProps = {
  message: string;
  onDismiss?: () => void;
  actionLabel?: string;
  onActionPress?: () => void;
  hasBottomBar?: boolean;
};
