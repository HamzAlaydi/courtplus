import type { ThemeConfig } from "antd";

export const LIME = "#c8f542";

export const theme: ThemeConfig = {
  token: {
    colorPrimary: "#a8d40e",
    colorInfo: "#a8d40e",
    colorLink: "#7ea60a",
    borderRadius: 8,
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  components: {
    Layout: {
      siderBg: "#0a1517",
      headerBg: "#ffffff",
      bodyBg: "#f4f6f4",
    },
    Menu: {
      darkItemBg: "#0a1517",
      darkSubMenuItemBg: "#0a1517",
      darkItemSelectedBg: "rgba(200, 245, 66, 0.14)",
      darkItemSelectedColor: LIME,
      darkItemColor: "rgba(255, 255, 255, 0.72)",
      darkItemHoverColor: "#ffffff",
    },
  },
};
