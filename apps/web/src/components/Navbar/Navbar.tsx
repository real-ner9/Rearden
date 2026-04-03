import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  House,
  MonitorPlay,
  PaperPlaneTilt,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { Avatar } from "@/components/Avatar/Avatar";
import styles from "./Navbar.module.scss";

export function Navbar() {
  const user = useAuthStore((s) => s.user);
  const conversations = useChatStore((s) => s.conversations);
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === "/auth") return null;

  const chatUnread = user
    ? conversations.reduce((sum, c) => sum + c.unreadCount, 0)
    : 0;

  const authGate =
    (target: string) => (e: React.MouseEvent) => {
      if (!user) {
        e.preventDefault();
        navigate("/auth", { state: { from: target } });
      }
    };

  return (
    <nav className={styles.bottomNav}>
      {/* Home */}
      <NavLink to="/" end className={styles.bottomTab}>
        {({ isActive }) => (
          <div
            className={`${styles.bottomTabInner} ${isActive ? styles.bottomActive : ""}`}
          >
            <House size={26} weight={isActive ? "fill" : "regular"} />
          </div>
        )}
      </NavLink>

      {/* Reels */}
      <NavLink to="/feed" className={styles.bottomTab}>
        {({ isActive }) => (
          <div
            className={`${styles.bottomTabInner} ${isActive ? styles.bottomActive : ""}`}
          >
            <MonitorPlay size={26} weight={isActive ? "fill" : "regular"} />
          </div>
        )}
      </NavLink>

      {/* Messages (auth-gated) */}
      <NavLink
        to={user ? "/chat" : "/auth"}
        className={styles.bottomTab}
        onClick={authGate("/chat")}
      >
        {({ isActive }) => (
          <div
            className={`${styles.bottomTabInner} ${isActive ? styles.bottomActive : ""}`}
          >
            <span className={styles.iconWrap}>
              <PaperPlaneTilt
                size={26}
                weight={isActive ? "fill" : "regular"}
              />
              {chatUnread > 0 && (
                <span className={styles.badge}>{chatUnread}</span>
              )}
            </span>
          </div>
        )}
      </NavLink>

      {/* Search */}
      <NavLink to="/search" className={styles.bottomTab}>
        {({ isActive }) => (
          <div
            className={`${styles.bottomTabInner} ${isActive ? styles.bottomActive : ""}`}
          >
            <MagnifyingGlass size={26} weight={isActive ? "bold" : "regular"} />
          </div>
        )}
      </NavLink>

      {/* Profile (avatar) */}
      <NavLink
        to={user ? "/profile" : "/auth"}
        className={styles.bottomTab}
        onClick={authGate("/profile")}
      >
        {({ isActive }) => (
          <div
            className={`${styles.bottomTabInner} ${isActive ? styles.bottomActive : ""}`}
          >
            <div
              className={`${styles.avatarWrap} ${isActive ? styles.activeAvatar : ""}`}
            >
              <Avatar
                src={user?.thumbnailUrl}
                name={user?.name || user?.username}
                size="sm"
              />
            </div>
          </div>
        )}
      </NavLink>
    </nav>
  );
}
