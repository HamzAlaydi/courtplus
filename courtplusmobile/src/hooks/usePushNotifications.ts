import { getMessaging, onMessage } from "@react-native-firebase/messaging";
import { showSnackbar } from "atoms/Snackbar/SnackBar.utils";
import { useEffect } from "react";

/**
 * Displays FCM messages in-app while the app is in the foreground.
 * (The OS only shows notification banners when the app is backgrounded.)
 */
export const usePushNotifications = () => {
  useEffect(() => {
    const unsubscribe = onMessage(getMessaging(), async (remoteMessage) => {
      const message = [
        remoteMessage.notification?.title,
        remoteMessage.notification?.body,
      ]
        .filter(Boolean)
        .join("\n");
      if (message) {
        showSnackbar({ message });
      }
    });
    return unsubscribe;
  }, []);
};
