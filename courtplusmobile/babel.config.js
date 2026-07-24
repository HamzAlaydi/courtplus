module.exports = {
  presets: ["module:@react-native/babel-preset"],
  plugins: [
    [
      "module-resolver",
      {
        alias: {
          atoms: "./src/components/atoms",
          molecules: "./src/components/molecules",
          organisms: "./src/components/organisms",
          components: "./src/components/index",
          screens: "./src/screens/index",
          navigation: "./src/navigation",
          models: "./src/models/index",
          store: "./src/store/index",
          apis: "./src/apis/index",
          theme: "./src/theme/index",
          utils: "./src/utils/index",
          hooks: "./src/hooks/index",
          assets: "./assets",
          contexts: "./src/contexts/index",
          translation: "./src/translation",
          icons: "./assets/images/svg/index",
          types: "./src/types/index",
        },
      },
    ],
    "react-native-worklets/plugin",
  ],
};
