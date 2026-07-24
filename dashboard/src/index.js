import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/index.scss";
import "./i18n";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store, persistor } from "./context/index"; // Import store and persistor
import { PersistGate } from "redux-persist/integration/react";
import { NotificationProvider } from "./modules/NotificationProvider";

// 🔹 Configure the global query settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2, // 🔹 Only retry twice if the API fails
      // retryDelay: (attemptIndex) => Math.min(15000 * attemptIndex, 30000), // 🔹 15s → 30s delay between retries
      staleTime: 60000, // 🔹 Cache data for 60s before refetching
      cacheTime: 300000, // 🔹 Keep cache for 5 minutes
      refetchOnWindowFocus: false, // 🔹 Prevent unnecessary refetch when switching tabs
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Provider store={store}>
    <BrowserRouter>
      <PersistGate loading={null} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <NotificationProvider>
            <React.StrictMode>
              <App />
            </React.StrictMode>
          </NotificationProvider>
        </QueryClientProvider>
      </PersistGate>
    </BrowserRouter>
  </Provider>
);
