/**
 * Jest setup: mocks for native modules used across the app so the
 * component tree can render in a Node environment.
 */

// Shipped mocks provided by the packages themselves.
require("react-native-gesture-handler/jestSetup");

jest.mock("react-native-reanimated", () =>
  require("react-native-reanimated/mock")
);
jest.mock("react-native-worklets", () =>
  require("react-native-worklets/src/mock")
);
jest.mock("react-native-safe-area-context", () =>
  require("react-native-safe-area-context/jest/mock")
);
jest.mock("@gorhom/bottom-sheet", () => require("@gorhom/bottom-sheet/mock"));
jest.mock("react-native-device-info", () =>
  require("react-native-device-info/jest/react-native-device-info-mock")
);
jest.mock("@react-native-community/netinfo", () =>
  require("@react-native-community/netinfo/jest/netinfo-mock")
);
jest.mock("@stripe/stripe-react-native", () =>
  require("@stripe/stripe-react-native/jest/mock")
);
jest.mock("react-native-video", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: View };
});
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// Firebase (no shipped mocks).
jest.mock("@react-native-firebase/app", () => ({
  getApp: jest.fn(() => ({ name: "[DEFAULT]" })),
  initializeApp: jest.fn(async () => ({ name: "[DEFAULT]" })),
}));

jest.mock("@react-native-firebase/auth", () => ({
  getAuth: jest.fn(() => ({
    currentUser: null,
    onAuthStateChanged: jest.fn(() => jest.fn()),
    signOut: jest.fn(async () => undefined),
  })),
}));

jest.mock("@react-native-firebase/messaging", () => ({
  getMessaging: jest.fn(() => ({
    getToken: jest.fn(async () => "fcm-token"),
    onMessage: jest.fn(() => jest.fn()),
    setBackgroundMessageHandler: jest.fn(),
    hasPermission: jest.fn(async () => 1),
    requestPermission: jest.fn(async () => 1),
    isDeviceRegisteredForRemoteMessages: true,
    registerDeviceForRemoteMessages: jest.fn(async () => undefined),
  })),
  onMessage: jest.fn(() => jest.fn()),
  onNotificationOpenedApp: jest.fn(() => jest.fn()),
  getInitialNotification: jest.fn(async () => null),
  onTokenRefresh: jest.fn(() => jest.fn()),
  AuthorizationStatus: {
    AUTHORIZED: 1,
    DENIED: 0,
    NOT_DETERMINED: -1,
    PROVISIONAL: 2,
    EPHEMERAL: 3,
  },
}));

// Google Sign-In.
jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(async () => true),
    signIn: jest.fn(),
    signOut: jest.fn(),
    getTokens: jest.fn(),
  },
  GoogleSigninButton: () => null,
  statusCodes: {
    SIGN_IN_CANCELLED: "SIGN_IN_CANCELLED",
    IN_PROGRESS: "IN_PROGRESS",
    PLAY_SERVICES_NOT_AVAILABLE: "PLAY_SERVICES_NOT_AVAILABLE",
  },
  isSuccessResponse: jest.fn(),
  isErrorWithCode: jest.fn(),
}));

// MMKV storage (zustand persist adapter).
jest.mock("react-native-mmkv", () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn(() => undefined),
    getNumber: jest.fn(() => undefined),
    getBoolean: jest.fn(() => undefined),
    set: jest.fn(),
    delete: jest.fn(),
    clearAll: jest.fn(),
    contains: jest.fn(() => false),
  })),
}));

// react-native-maps renders native views; replace with plain Views.
jest.mock("react-native-maps", () => {
  const React = require("react");
  const { View } = require("react-native");
  const MockMapView = (props) =>
    React.createElement(View, props, props.children);
  MockMapView.Animated = MockMapView;
  const MockComponent = (props) => React.createElement(View, props);
  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockComponent,
    Circle: MockComponent,
    Polyline: MockComponent,
    Polygon: MockComponent,
    Callout: MockComponent,
    PROVIDER_GOOGLE: "google",
    PROVIDER_DEFAULT: null,
  };
});

// Geolocation.
jest.mock("react-native-geolocation-service", () => ({
  getCurrentPosition: jest.fn((success) =>
    success({ coords: { latitude: 0, longitude: 0 } })
  ),
  watchPosition: jest.fn(() => 0),
  clearWatch: jest.fn(),
  requestAuthorization: jest.fn(async () => "granted"),
}));

// Misc native modules with no JS fallback.
jest.mock("react-native-restart", () => ({
  __esModule: true,
  default: { restart: jest.fn(), Restart: jest.fn() },
}));
jest.mock("react-native-fast-image", () => {
  const { Image } = require("react-native");
  return {
    __esModule: true,
    default: Image,
    priority: { low: "low", normal: "normal", high: "high" },
    cacheControl: { immutable: "immutable", web: "web", cacheOnly: "cacheOnly" },
    preload: jest.fn(),
  };
});
jest.mock("react-native-linear-gradient", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: View };
});
jest.mock("react-native-device-country", () => ({
  getDeviceCountry: jest.fn(async () => "SA"),
}));
jest.mock("react-native-image-picker", () => ({
  launchCamera: jest.fn(),
  launchImageLibrary: jest.fn(),
}));
jest.mock("@bam.tech/react-native-image-resizer", () => ({
  __esModule: true,
  default: { createResizedImage: jest.fn() },
}));
jest.mock("react-native-date-picker", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: View };
});
