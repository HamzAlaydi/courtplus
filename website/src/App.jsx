import { useEffect } from "react";
import { ConfigProvider } from "antd";
import { useTranslation } from "react-i18next";
import Layout from "./components/layout";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/home/Home";
import Journal from "./pages/journal/Journal";
import Player from "./pages/player/Player";
import Faqs from "./pages/faqs/Faqs";
import Contact from "./pages/contact/Contact";
import Terms from "./pages/terms/Terms";
import Privacy from "./pages/privacy/Privacy";

function App() {
  const { i18n } = useTranslation();

  const language = i18n.language?.startsWith("ar") ? "ar" : "en";
  const direction = language === "ar" ? "rtl" : "ltr";

  // Keep <html> lang/dir in sync for SEO, a11y and CSS
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    document.body.dir = direction;
  }, [language, direction]);

  return (
    <>
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
            <Route path="/" element={<Layout />}>
              <Route path="" element={<Home />} index />
              <Route path="players" element={<Player />} index />
              <Route path="journal" element={<Journal />} index />
              <Route path="faqs" element={<Faqs />} index />
              <Route path="contact-us" element={<Contact />} index />
              <Route path="terms" element={<Terms />} index />
              <Route path="privacy" element={<Privacy />} index />
            </Route>
          </Routes>
        </div>
      </ConfigProvider>
    </>
  );
}

export default App;
