import { Outlet } from "react-router-dom";
import "./index.scss";
import Navbar from "./navbar/Navbar";
import Footer from "./footer/Footer";

export default function Layout() {
  return (
    <div className="layout">
      <Navbar />
      <div className="layout-body">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
