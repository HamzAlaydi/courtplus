/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { ThemeProvider } from "contexts";
import MainNavigation from "navigation/MainNavigation";
import React, { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "translation/index";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import {
  asyncStoragePersister,
  cleanup,
  dehydrateQuery,
  queryClient,
} from "utils";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { configure } from "@react-native-community/netinfo";
import { GlobalLoader } from "atoms/index";
import FlashMessage from "react-native-flash-message";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { usePushNotifications } from "hooks";

function App(): React.JSX.Element {
  usePushNotifications();
  useEffect(() => {
    configure({
      reachabilityUrl: "https://clients3.google.com/generate_204",
      reachabilityTest: async (response) => response.status === 204,
      reachabilityLongTimeout: 60 * 1000, // 60s
      reachabilityShortTimeout: 5 * 1000, // 5s
      reachabilityRequestTimeout: 15 * 1000, // 15s
    });
    GoogleSignin.configure({
      webClientId:
        "467162134338-e2jig4bavpcrr4cal6bvp7sr23tjcc45.apps.googleusercontent.com",
      scopes: ["profile", "email"],
    });
    return () => cleanup();
  }, []);
  return (
    <GestureHandlerRootView>
      <ThemeProvider>
        <I18nextProvider i18n={i18n}>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
              persister: asyncStoragePersister,
              dehydrateOptions: {
                shouldDehydrateQuery: dehydrateQuery,
              },
            }}
          >
            <BottomSheetModalProvider>
              <MainNavigation />
            </BottomSheetModalProvider>
            <GlobalLoader />
            <FlashMessage position="bottom" />
          </PersistQueryClientProvider>
        </I18nextProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

export default App;
