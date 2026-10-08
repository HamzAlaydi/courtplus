import { ConfigProvider } from "antd";
import { useTranslation } from "react-i18next";
import { Navigate, Route, Routes } from "react-router-dom";
import "slick-carousel/slick/slick-theme.css";
import "slick-carousel/slick/slick.css";
import DashboardLayout from "./components/layout/DashboardLayout";
import "./i18n";
import AuthWrapper from "./modules/AuthWrapper";
import GuestWrapper from "./modules/GuestWrapper";
import AddBranch from "./pages/AddBranch";
import AddCourt from "./pages/AddCourt";
import Billing from "./pages/Billing";
import Branch from "./pages/Branch";
import Branches from "./pages/Branches";
import Court from "./pages/Court";
import Courts from "./pages/Courts";
import ForgetPass from "./pages/ForgetPass";
import Home from "./pages/Home";
import OtpForm from "./pages/OtpForm";
import ResetPass from "./pages/ResetPass";
import ScheduleDetails from "./pages/SceduleDetails";
import Schedule from "./pages/Schedule";
import SettingsPage from "./pages/Settings";
import SignInForm from "./pages/SigninForm";
import SignUpForm from "./pages/SignupForm";
import Team from "./pages/Team";
import Users from "./pages/Users";

// Court+ palette (mirrors src/styles/base/_variables.scss).
const INK = "#0A1517";
const DEEP = "#142326";
const LIME = "#C0FF42";
const LIME_HOVER = "#B5F536";
const LIME_ACTIVE = "#A6E62A";
const GROUND = "#F3F5F4";
const LINE = "#E4E9E8";
const LINE_STRONG = "#C9D3D2";
const DIVIDER = "#EEF1F0";
const MUTED = "#627174";
const FAINT = "#9AA6A8";
const LIME_TINT = "#EEF9D4";
const ROW_HOVER = "#F7F9F8";
const FONT_TEXT = "'Readex Pro', system-ui, -apple-system, 'Segoe UI', sans-serif";
const SHADOW_POPUP =
  "0 2px 6px rgba(10, 21, 23, 0.06), 0 14px 36px rgba(10, 21, 23, 0.14)";
const FOCUS_GLOW = "0 0 0 3px rgba(192, 255, 66, 0.55)";

// Fields: ink border on focus with a lime glow, so lime never sits as a thin
// line or as text on white.
const FIELD = {
  borderRadius: 14,
  borderRadiusLG: 14,
  borderRadiusSM: 10,
  hoverBorderColor: LINE_STRONG,
  activeBorderColor: INK,
  activeShadow: FOCUS_GLOW,
};

// Lime is a fill under ink text (primary buttons, active sidebar item);
// anything that would paint the primary colour as text or a hairline on white
// is pointed at ink instead.
const theme = {
  token: {
    colorPrimary: LIME,
    colorPrimaryHover: LIME_HOVER,
    colorPrimaryActive: LIME_ACTIVE,
    colorPrimaryBg: LIME_TINT,
    colorPrimaryBgHover: "#E6F5C2",
    colorPrimaryBorder: "#D9F59A",
    colorPrimaryBorderHover: "#CBEF7A",
    colorPrimaryText: INK,
    colorPrimaryTextHover: DEEP,
    colorPrimaryTextActive: INK,
    colorInfo: INK,
    colorInfoBg: DIVIDER,
    colorInfoBorder: LINE,
    colorSuccess: "#0B6B3D",
    colorSuccessBg: "#E6F6EE",
    colorSuccessBorder: "#BFE6D1",
    colorWarning: "#E8A400",
    colorWarningBg: "#FFF6DC",
    colorWarningBorder: "#F9E3A6",
    colorError: "#D92D20",
    colorErrorBg: "#FEECEB",
    colorErrorBorder: "#FBCDC9",
    colorLink: INK,
    colorLinkHover: DEEP,
    colorLinkActive: INK,
    colorText: INK,
    colorTextHeading: INK,
    colorTextSecondary: MUTED,
    colorTextTertiary: MUTED,
    colorTextDescription: MUTED,
    colorTextPlaceholder: FAINT,
    colorTextDisabled: FAINT,
    colorBorder: LINE,
    colorBorderSecondary: DIVIDER,
    colorSplit: DIVIDER,
    colorBgLayout: GROUND,
    colorBgContainer: "#FFFFFF",
    colorBgElevated: "#FFFFFF",
    colorBgSpotlight: INK,
    colorBgSolid: INK,
    colorBgSolidHover: DEEP,
    colorBgSolidActive: INK,
    controlItemBgHover: GROUND,
    controlItemBgActive: LIME_TINT,
    controlItemBgActiveHover: "#E6F5C2",
    controlOutline: "rgba(192, 255, 66, 0.55)",
    controlOutlineWidth: 3,
    fontFamily: FONT_TEXT,
    fontSize: 14,
    fontWeightStrong: 600,
    borderRadius: 12,
    borderRadiusLG: 16,
    borderRadiusSM: 8,
    borderRadiusXS: 6,
    controlHeight: 44,
    controlHeightLG: 52,
    controlHeightSM: 34,
    boxShadowSecondary: SHADOW_POPUP,
    motionDurationFast: "0.12s",
    motionDurationMid: "0.18s",
    motionDurationSlow: "0.22s",
  },
  components: {
    Layout: {
      siderBg: INK,
      bodyBg: GROUND,
      headerBg: GROUND,
      headerColor: INK,
      headerHeight: 88,
      headerPadding: "0 clamp(16px, 3vw, 40px)",
      triggerBg: DEEP,
      lightSiderBg: "#FFFFFF",
    },
    Menu: {
      darkItemBg: INK,
      darkSubMenuItemBg: INK,
      darkPopupBg: INK,
      darkItemColor: "#C8D3D4",
      darkItemHoverColor: "#FFFFFF",
      darkItemHoverBg: "rgba(255, 255, 255, 0.06)",
      darkItemSelectedBg: LIME,
      darkItemSelectedColor: INK,
      darkGroupTitleColor: "#AEBBBD",
      itemSelectedBg: LIME_TINT,
      itemSelectedColor: INK,
      itemHoverBg: GROUND,
      itemActiveBg: LIME_TINT,
      itemHeight: 44,
      itemBorderRadius: 12,
      subMenuItemBorderRadius: 12,
      itemMarginInline: 0,
      itemMarginBlock: 4,
      iconSize: 18,
      collapsedIconSize: 18,
      collapsedWidth: 48,
      iconMarginInlineEnd: 12,
      activeBarBorderWidth: 0,
      fontSize: 14,
    },
    Button: {
      primaryColor: INK,
      primaryShadow: "none",
      defaultShadow: "none",
      dangerShadow: "none",
      defaultColor: INK,
      defaultBg: "#FFFFFF",
      defaultBorderColor: LINE,
      defaultHoverColor: INK,
      defaultHoverBg: "#FFFFFF",
      defaultHoverBorderColor: INK,
      defaultActiveColor: INK,
      defaultActiveBg: GROUND,
      defaultActiveBorderColor: INK,
      textTextColor: INK,
      textHoverBg: "rgba(10, 21, 23, 0.05)",
      linkHoverBg: "transparent",
      borderRadius: 999,
      borderRadiusLG: 999,
      borderRadiusSM: 999,
      paddingInline: 20,
      paddingInlineLG: 26,
      paddingInlineSM: 14,
      fontWeight: 600,
      contentFontSizeLG: 15,
    },
    Card: {
      borderRadiusLG: 22,
      colorBorderSecondary: DIVIDER,
      headerFontSize: 14,
      headerHeight: 56,
      bodyPadding: 22,
      headerPadding: 22,
      bodyPaddingSM: 16,
      headerPaddingSM: 16,
    },
    Table: {
      headerBg: "#FFFFFF",
      headerColor: MUTED,
      headerSplitColor: "transparent",
      headerBorderRadius: 0,
      headerSortActiveBg: ROW_HOVER,
      headerSortHoverBg: ROW_HOVER,
      headerFilterHoverBg: ROW_HOVER,
      bodySortBg: "#FBFCFB",
      rowHoverBg: ROW_HOVER,
      rowSelectedBg: "#F7FBEC",
      rowSelectedHoverBg: LIME_TINT,
      borderColor: DIVIDER,
      cellPaddingBlock: 12,
      cellPaddingInline: 12,
      cellPaddingBlockMD: 10,
      cellPaddingInlineMD: 10,
      colorPrimary: INK,
    },
    Tag: {
      borderRadiusSM: 999,
      defaultBg: DIVIDER,
      defaultColor: "#3F4D50",
    },
    Segmented: {
      trackBg: DIVIDER,
      trackPadding: 4,
      itemColor: MUTED,
      itemHoverColor: INK,
      itemHoverBg: "rgba(10, 21, 23, 0.05)",
      itemActiveBg: "rgba(10, 21, 23, 0.08)",
      itemSelectedBg: INK,
      itemSelectedColor: "#FFFFFF",
      borderRadius: 999,
      borderRadiusLG: 999,
      borderRadiusSM: 999,
      borderRadiusXS: 999,
    },
    Tabs: {
      itemColor: MUTED,
      itemHoverColor: INK,
      itemActiveColor: INK,
      itemSelectedColor: INK,
      inkBarColor: INK,
      titleFontSize: 14,
      horizontalItemGutter: 28,
      cardBg: GROUND,
    },
    Input: {
      ...FIELD,
      paddingInline: 14,
      paddingInlineLG: 16,
    },
    InputNumber: {
      ...FIELD,
      paddingInline: 14,
    },
    Select: {
      ...FIELD,
      activeOutlineColor: "rgba(192, 255, 66, 0.55)",
      optionSelectedBg: LIME_TINT,
      optionSelectedColor: INK,
      optionSelectedFontWeight: 600,
      optionActiveBg: GROUND,
      optionHeight: 38,
      optionPadding: "8px 12px",
      multipleItemBg: DIVIDER,
    },
    DatePicker: {
      ...FIELD,
      colorTextLightSolid: INK,
      cellActiveWithRangeBg: LIME_TINT,
    },
    Calendar: {
      colorTextLightSolid: INK,
      itemActiveBg: LIME_TINT,
    },
    Modal: {
      borderRadiusLG: 22,
      contentPadding: "24px 24px 20px",
      headerMarginBottom: 16,
      titleFontSize: 16,
      titleColor: INK,
    },
    Dropdown: {
      borderRadiusLG: 16,
      borderRadiusSM: 10,
      controlItemBgHover: GROUND,
    },
    Popover: {
      borderRadiusLG: 16,
    },
    Form: {
      labelColor: INK,
      labelRequiredMarkColor: "#D92D20",
      verticalLabelPadding: "0 0 6px",
      itemMarginBottom: 20,
    },
    Radio: {
      colorPrimary: INK,
      colorPrimaryHover: DEEP,
      colorPrimaryActive: INK,
      buttonSolidCheckedBg: INK,
      buttonSolidCheckedHoverBg: DEEP,
      buttonSolidCheckedActiveBg: INK,
      buttonSolidCheckedColor: "#FFFFFF",
    },
    Checkbox: {
      colorPrimary: INK,
      colorPrimaryHover: DEEP,
      borderRadiusSM: 6,
    },
    Switch: {
      colorPrimary: INK,
      colorPrimaryHover: DEEP,
    },
    Pagination: {
      colorPrimary: INK,
      colorPrimaryHover: DEEP,
      itemActiveBg: INK,
      borderRadius: 999,
    },
    Steps: {
      colorPrimary: INK,
    },
    Spin: {
      colorPrimary: INK,
    },
    Progress: {
      defaultColor: INK,
      remainingColor: DIVIDER,
    },
    Breadcrumb: {
      itemColor: MUTED,
      lastItemColor: INK,
      linkColor: MUTED,
      linkHoverColor: INK,
      separatorColor: FAINT,
      separatorMargin: 6,
    },
    Descriptions: {
      labelBg: ROW_HOVER,
    },
    Collapse: {
      headerBg: "#FFFFFF",
      borderRadiusLG: 16,
    },
    Statistic: {
      titleFontSize: 13,
      contentFontSize: 26,
    },
    Alert: {
      borderRadiusLG: 16,
    },
    Badge: {
      indicatorHeight: 18,
      indicatorHeightSM: 16,
    },
    Tooltip: {
      borderRadius: 10,
    },
  },
};

function App() {
  const { i18n } = useTranslation();

  // Get language preference from localStorage or default to 'en'
  const savedLanguage = i18n.language || "en";
  const direction = savedLanguage === "ar" ? "rtl" : "ltr";

  return (
    <ConfigProvider direction={direction} theme={theme}>
      <div className="App" dir={direction}>
        <Routes>
          <Route
            path="/auth/*"
            element={
              <GuestWrapper>
                <Routes>
                  <Route index element={<SignInForm />} />
                  <Route path="signin" element={<SignInForm />} />
                  <Route path="signup" element={<SignUpForm />} />
                  <Route path="verification" element={<OtpForm />} />
                  <Route path="forget-password" element={<ForgetPass />} />
                  <Route path="reset-password" element={<ResetPass />} />
                </Routes>
              </GuestWrapper>
            }
          />

          <Route
            path="/*"
            element={
              <AuthWrapper>
                <DashboardLayout />
              </AuthWrapper>
            }
          >
            <Route path="" element={<Home />} index />
            <Route path="home" element={<Home />} />
            <Route path="users" element={<Users />} />
            <Route path="branches" element={<Branches />} />
            <Route path="branches/:id" element={<Branch />} />
            <Route path="branches/:id/edit" element={<AddBranch />} />
            <Route path="branches/add" element={<AddBranch />} />
            <Route path="courts" element={<Courts />} />
            <Route path="courts/:id" element={<Court />} />
            <Route path="courts/:id/edit" element={<AddCourt />} />
            <Route path="courts/add" element={<AddCourt />} />
            <Route path="billing" element={<Billing />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="schedule/:id" element={<ScheduleDetails />} />
            <Route path="team" element={<Team />} />
            <Route path="settings" element={<SettingsPage />} />
            {/* Anything else used to render the layout with an empty outlet:
                a blank page with a sidebar. Send it home instead. */}
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Route>
        </Routes>
      </div>
    </ConfigProvider>
  );
}

export default App;
