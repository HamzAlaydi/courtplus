import { Colors, ColorsType } from "./types";

const light: ColorsType = {
  GREEN_YELLOWISH: "#C0FF42",
  DARK_GREEN: "#142326",
  WHITE: "#FFFFFF",
  GREY: "#89909F",
  GREEN: "#04B943",
  BLACK: "#000000",
  BACKGROUND: "#0A1517",
  DARK_RED: "#FF00000F",
  MED_RED: "#FF0000",
  RED: "#F44336",
  CYAN: "#455c61",
  SUBMARINE: "#80959A",
  SLATE_GRAY: "#667085",
  LIGHT_BLUE: "#E8F2FC",
  BLUE_LIGHTEST: "#F3F8FD",
  GRAYISH_BLUE: "#A8B0BE",
  GHOST_WHITE: "#F9FAFC",
  MED_GREY: "#BCC4D1",
  LIGHT_GREY: "#F2F4F7",
  YELLOW: "#FFC700",
  MED_GREEN: "#00AA5B",
  MED_GREY_2: "#EDEDED",
  MED_GREY_3: "#D0D5DD",
  TIMID_CLOUD: "#dadbe4",
  BUTTON_GREEN: "#28483E",
  DARK_BLUE: "#1C2B42",
  MED_BLACK: "#0A1517B2",
};

const dark: ColorsType = {
  GREEN_YELLOWISH: "#C0FF42",
  DARK_GREEN: "#142326",
  WHITE: "#FFFFFF",
  GREY: "#89909F",
  GREEN: "#04B943",
  BLACK: "#000000",
  BACKGROUND: "#0A1517",
  DARK_RED: "#FF00000F",
  CYAN: "#455c61",
  RED: "#F44336",
  SUBMARINE: "#80959A",
  SLATE_GRAY: "#667085",
  LIGHT_BLUE: "#E8F2FC",
  BLUE_LIGHTEST: "#F3F8FD",
  GRAYISH_BLUE: "#A8B0BE",
  GHOST_WHITE: "#F9FAFC",
  MED_GREY: "#BCC4D1",
  LIGHT_GREY: "#F2F4F7",
  YELLOW: "#FFC700",
  MED_GREEN: "#00AA5B",
  MED_GREY_2: "#EDEDED",
  MED_GREY_3: "#D0D5DD",
  TIMID_CLOUD: "#dadbe4",
  BUTTON_GREEN: "#28483E",
  DARK_BLUE: "#1C2B42",
  MED_BLACK: "#0A1517B2",
  MED_RED: "#FF0000",
};

const AppColors: Colors = {
  dark: {
    colors: dark,
    dark: true,
  },
  light: {
    colors: light,
    dark: false,
  },
};

export { light, dark, AppColors };
