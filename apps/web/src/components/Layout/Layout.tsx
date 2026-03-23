import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "@/components/Navbar/Navbar";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import styles from "./Layout.module.scss";

export function Layout() {
  const location = useLocation();
  const isChatPage = location.pathname.startsWith("/chat");
  const isFeedPage = location.pathname === "/feed";

  return (
    <div className={styles.layout}>
      <Navbar />
      <div className={`${styles.body} ${isFeedPage ? styles.feedBody : ""}`}>
        <main className={styles.main}>
          <Outlet />
        </main>
        {!isChatPage && !isFeedPage && <Sidebar />}
      </div>
    </div>
  );
}
