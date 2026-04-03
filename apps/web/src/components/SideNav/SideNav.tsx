import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  House,
  MonitorPlay,
  PaperPlaneTilt,
  MagnifyingGlass,
  Heart,
  PlusSquare,
  UserCircle,
  SpeakerHigh,
  SpeakerSlash,
} from "@phosphor-icons/react";
import { useSoundStore } from "@/stores/soundStore";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import {
  useNotificationStore,
  selectUnreadCount,
} from "@/stores/notificationStore";
import { NotificationPanel } from "@/components/NotificationPanel/NotificationPanel";
import styles from "./SideNav.module.scss";

export function SideNav() {
  const location = useLocation();
  if (location.pathname === "/auth") return null;
  const enabled = useSoundStore((s) => s.enabled);
  const setEnabled = useSoundStore((s) => s.setEnabled);
  const user = useAuthStore((s) => s.user);
  const conversations = useChatStore((s) => s.conversations);
  const notifUnread = useNotificationStore(selectUnreadCount);
  const navigate = useNavigate();

  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const chatUnread = user ? conversations.reduce((sum, c) => sum + c.unreadCount, 0) : 0;

  // Close notification popup on outside click
  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]);

  // Navigate to /auth if not authed, otherwise go to target
  const authGate = useCallback(
    (target: string) => (e: React.MouseEvent) => {
      if (!user) {
        e.preventDefault();
        navigate("/auth", { state: { from: target } });
      }
    },
    [user, navigate],
  );

  return (
    <nav className={`${styles.sideNav} ${notifOpen ? styles.expanded : ""}`}>
      <div className={styles.top}>
        {/* Logo */}
        <NavLink to="/" className={styles.logoLink}>
          <span className={styles.logoIcon}>R</span>
          <span className={styles.label}>REARDEN</span>
        </NavLink>

        {/* Home */}
        <NavLink to="/" end className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ""}`}>
          <span className={styles.iconWrap}>
            <House size={24} weight="regular" />
          </span>
          <span className={styles.label}>Home</span>
        </NavLink>

        {/* Reels */}
        <NavLink to="/feed" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ""}`}>
          <span className={styles.iconWrap}>
            <MonitorPlay size={24} weight="regular" />
          </span>
          <span className={styles.label}>Reels</span>
        </NavLink>

        {/* Chat (auth-gated) */}
        <NavLink
          to="/chat"
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ""}`}
          onClick={authGate("/chat")}
        >
          <span className={styles.iconWrap}>
            <PaperPlaneTilt size={24} weight="regular" />
            {chatUnread > 0 && <span className={styles.badge}>{chatUnread}</span>}
          </span>
          <span className={styles.label}>Chat</span>
        </NavLink>

        {/* Search */}
        <NavLink to="/search" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ""}`}>
          <span className={styles.iconWrap}>
            <MagnifyingGlass size={24} weight="regular" />
          </span>
          <span className={styles.label}>Search</span>
        </NavLink>

        {/* Notifications (auth-gated) */}
        {user ? (
          <div className={styles.notifWrapper} ref={notifRef}>
            <button
              className={`${styles.navItem} ${notifOpen ? styles.active : ""}`}
              onClick={() => setNotifOpen((o) => !o)}
            >
              <span className={styles.iconWrap}>
                <Heart size={24} weight={notifOpen ? "fill" : "regular"} />
                {notifUnread > 0 && <span className={styles.badge}>{notifUnread}</span>}
              </span>
              <span className={styles.label}>Notifications</span>
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  className={styles.notifPopup}
                  initial={{ opacity: 0, x: -10, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -10, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                >
                  <NotificationPanel />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <button
            className={styles.navItem}
            onClick={() => navigate("/auth")}
          >
            <span className={styles.iconWrap}>
              <Heart size={24} weight="regular" />
            </span>
            <span className={styles.label}>Notifications</span>
          </button>
        )}

        {/* Create (auth-gated) */}
        <NavLink
          to="/create"
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ""}`}
          onClick={authGate("/create")}
        >
          <span className={styles.iconWrap}>
            <PlusSquare size={24} weight="regular" />
          </span>
          <span className={styles.label}>Create</span>
        </NavLink>

        {/* Profile / Auth */}
        {user ? (
          <NavLink
            to="/profile"
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ""}`}
          >
            <span className={styles.iconWrap}>
              <UserCircle size={24} weight="regular" />
            </span>
            <span className={styles.label}>{user.username || "Account"}</span>
          </NavLink>
        ) : (
          <NavLink to="/auth" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ""}`}>
            <span className={styles.iconWrap}>
              <UserCircle size={24} weight="regular" />
            </span>
            <span className={styles.label}>Sign In</span>
          </NavLink>
        )}
      </div>

      <div className={styles.bottom}>
        {/* Sound toggle */}
        <button className={styles.navItem} onClick={() => setEnabled(!enabled)} title={enabled ? "Mute sounds" : "Enable sounds"}>
          <span className={styles.iconWrap}>
            {enabled ? (
              <SpeakerHigh size={24} weight="regular" />
            ) : (
              <SpeakerSlash size={24} weight="regular" />
            )}
          </span>
          <span className={styles.label}>{enabled ? "Sound On" : "Sound Off"}</span>
        </button>
      </div>
    </nav>
  );
}
