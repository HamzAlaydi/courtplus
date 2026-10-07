import React from "react";
import { showMessage, hideMessage } from "react-native-flash-message";
import { t } from "i18next";
import Snackbar from "./Snackbar.component";

type SnackbarOptions = {
  message: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export const showSnackbar = (options: SnackbarOptions) => {
  // Callers routinely pass `(error as Error).message`, which is `undefined`
  // for anything that is not a real Error — the axios interceptor rejects
  // with a plain object. That rendered an EMPTY bar, so a failed action
  // looked to the user like the app had simply ignored the tap.
  const message =
    typeof options.message === "string" && options.message.trim()
      ? options.message
      : t("messages.somethingWentWrong");

  showMessage({
    message,
    hideStatusBar: true,
    position: "bottom",
    // 3s was not long enough to read a two-line error on a phone.
    duration: 5000,
    type: "none",
    backgroundColor: "transparent",
    // The library's OWN wrapper needs the elevation too: on Android z-order
    // comes from elevation, not tree order, so without this the wrapper still
    // sat under any elevated floating button and clipped the bar inside it.
    style: { elevation: 24, zIndex: 9999, backgroundColor: "transparent" },
    floating: true,
    renderCustomContent: () => (
      <Snackbar
        message={message}
        onDismiss={() => hideMessage()}
        actionLabel={options.actionLabel}
        onActionPress={options.onActionPress}
      />
    ),
  });
};
