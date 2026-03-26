import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "@/components/Navbar/Navbar";
import { SideNav } from "@/components/SideNav/SideNav";
import { MessagesPopup } from "@/components/MessagesPopup/MessagesPopup";
import styles from "./Layout.module.scss";

export function Layout() {
  const location = useLocation();
  const isFeedPage = location.pathname === "/feed" || location.pathname.startsWith("/feed/");
  const isAuthPage = location.pathname === "/auth";

  return (
    <div className={styles.layout}>
      <SideNav />
      <Navbar />
      <div className={`${styles.body} ${isFeedPage ? styles.feedBody : ""} ${isAuthPage ? styles.authBody : ""}`}>
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
      <MessagesPopup />
    </div>
  );
}
