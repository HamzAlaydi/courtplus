import {
  getInitialNotification,
  getMessaging,
  onMessage,
  onNotificationOpenedApp,
} from "@react-native-firebase/messaging";
import {
  registerNotificationToken,
  subscribeToNotificationTokenRefresh,
} from "apis";
import { showSnackbar } from "atoms/Snackbar/SnackBar.utils";
import { useEffect } from "react";
import { useAppStore } from "store";
import { navigateToNotification, parsePushNotificationData } from "utils";

/**
 * - Displays FCM messages in-app while the app is in the foreground.
 *   (The OS only shows notification banners when the app is backgrounded.)
 * - Navigates when a notification is tapped (background or quit state).
 * - Uploads the FCM token on app start (when authenticated) and whenever
 *   Firebase rotates it.
 */
export const usePushNotifications = () => {
  useEffect(() => {
    if (useAppStore.getState().userTokens.accessToken) {
      registerNotificationToken();
    }
    const unsubscribeTokenRefresh = subscribeToNotificationTokenRefresh();

    const unsubscribeMessages = onMessage(
      getMessaging(),
      async (remoteMessage) => {
        const data = remoteMessage.data as
          | Record<string, unknown>
          | undefined;
        const title =
          remoteMessage.notification?.title ??
          (typeof data?.title === "string" ? data.title : undefined);
        const body =
          remoteMessage.notification?.body ??
          (typeof data?.body === "string" ? data.body : undefined);
        const message = [title, body].filter(Boolean).join("\n");
        if (message) {
          showSnackbar({ message });
        }
      }
    );

    const unsubscribeOpened = onNotificationOpenedApp(
      getMessaging(),
      (remoteMessage) => {
        navigateToNotification(parsePushNotificationData(remoteMessage.data));
      }
    );

    getInitialNotification(getMessaging()).then((remoteMessage) => {
      if (remoteMessage) {
        navigateToNotification(parsePushNotificationData(remoteMessage.data));
      }
    });

    return () => {
      unsubscribeMessages();
      unsubscribeOpened();
      unsubscribeTokenRefresh();
    };
  }, []);
};
