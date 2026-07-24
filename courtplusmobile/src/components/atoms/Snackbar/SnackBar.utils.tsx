import React from "react";
import { showMessage, hideMessage } from "react-native-flash-message";
import Snackbar from "./Snackbar.component";

type SnackbarOptions = {
  message: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export const showSnackbar = (options: SnackbarOptions) => {
  showMessage({
    message: options.message,
    hideStatusBar: true,
    position: "bottom",
    duration: 3000,
    type: "none",
    backgroundColor: "transparent",
    renderCustomContent: () => (
      <Snackbar
        message={options.message}
        onDismiss={() => hideMessage()}
        actionLabel={options.actionLabel}
        onActionPress={options.onActionPress}
      />
    ),
  });
};
