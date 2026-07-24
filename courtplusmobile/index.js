/**
 * @format
 */

import "react-native-get-random-values";
import { getMessaging } from "@react-native-firebase/messaging";
import { AppRegistry } from "react-native";
import App from "./App";
import { name as appName } from "./app.json";

if (__DEV__) {
  require("./ReactotronConfig");
}

// Required by @react-native-firebase/messaging so data-only messages can be
// processed when the app is in the background or quit. Notification payloads
// are displayed by the OS, so there is nothing to render here.
getMessaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log("Message handled in the background:", remoteMessage.messageId);
});

AppRegistry.registerComponent(appName, () => App);
