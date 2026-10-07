// antd v5's static APIs (message, notification, Modal) call the removed
// ReactDOM.render internally, so on React 19 they fail SILENTLY — every
// message.success()/error() in this app was a no-op, including the contact and
// FAQ form feedback. This compat shim restores them and must be imported
// before antd is used.
import "@ant-design/v5-patch-for-react-19";
import { createRoot } from "react-dom/client";
import "./assets/styles/index.scss";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import "./i18n";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
