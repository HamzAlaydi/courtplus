import { ConfigProvider } from "antd";
import { useTranslation } from "react-i18next";
import { Route, Routes } from "react-router-dom";
import "slick-carousel/slick/slick-theme.css";
import "slick-carousel/slick/slick.css";
import DashboardLayout from "./components/layout/DashboardLayout";
import "./i18n";
import AuthWrapper from "./modules/AuthWrapper";
import GuestWrapper from "./modules/GuestWrapper";
import AddBranch from "./pages/AddBranch";
import AddCourt from "./pages/AddCourt";
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
import Users from "./pages/Users";

function App() {
  const { i18n } = useTranslation();

  // Get language preference from localStorage or default to 'en'
  const savedLanguage = i18n.language || "en";
  const direction = savedLanguage === "ar" ? "rtl" : "ltr";

  return (
    <ConfigProvider
      direction={direction}
      theme={{
        token: {
          colorPrimary: "#c0ff42",
        },
      }}
    >
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
            <Route path="schedule" element={<Schedule />} />
            <Route path="schedule/:id" element={<ScheduleDetails />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </div>
    </ConfigProvider>
  );
}

export default App;
