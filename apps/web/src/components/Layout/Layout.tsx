import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "@/components/Navbar/Navbar";
import { SideNav } from "@/components/SideNav/SideNav";
import { MobileHeader } from "@/components/MobileHeader/MobileHeader";
import { MessagesPopup } from "@/components/MessagesPopup/MessagesPopup";
import { ErrorBoundary } from "@/components/ErrorBoundary/ErrorBoundary";
import styles from "./Layout.module.scss";

export function Layout() {
  const location = useLocation();
  const isFeedPage = location.pathname === "/feed" || location.pathname.startsWith("/feed/");
  const isAuthPage = location.pathname === "/auth";
  const isNotificationsPage = location.pathname === "/notifications";
  const isSettingsPage = location.pathname === "/profile/settings";

  return (
    <div className={styles.layout}>
      <SideNav />
      <MobileHeader />
      <Navbar />
      <div className={`${styles.body} ${isFeedPage ? styles.feedBody : ""} ${isAuthPage ? styles.authBody : ""} ${isNotificationsPage ? styles.notificationsBody : ""} ${isSettingsPage ? styles.settingsBody : ""}`}>
        <main className={styles.main}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
      <MessagesPopup />
    </div>
  );
}
