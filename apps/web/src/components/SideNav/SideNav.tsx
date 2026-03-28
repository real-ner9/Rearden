import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useSoundStore } from "@/stores/soundStore";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import {
  useNotificationStore,
  selectUnreadCount,
} from "@/stores/notificationStore";
import { NotificationPanel } from "@/components/NotificationPanel/NotificationPanel";
import { MoreMenu } from "@/components/MoreMenu/MoreMenu";
import styles from "./SideNav.module.scss";

export function SideNav() {
  const enabled = useSoundStore((s) => s.enabled);
  const setEnabled = useSoundStore((s) => s.setEnabled);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const conversations = useChatStore((s) => s.conversations);
  const notifUnread = useNotificationStore(selectUnreadCount);
  const navigate = useNavigate();

  const [notifOpen, setNotifOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

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

  // Close "More" popup on outside click
  useEffect(() => {
    if (!moreOpen) return;
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [moreOpen]);

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

  const popupOpen = notifOpen || moreOpen;

  return (
    <nav className={`${styles.sideNav} ${popupOpen ? styles.expanded : ""}`}>
      <div className={styles.top}>
        {/* Logo */}
        <NavLink to="/" className={styles.logoLink}>
          <span className={styles.logoIcon}>R</span>
          <span className={styles.label}>REARDEN</span>
        </NavLink>

        {/* Home */}
        <NavLink to="/" end className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ""}`}>
          <span className={styles.iconWrap}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </span>
          <span className={styles.label}>Home</span>
        </NavLink>

        {/* Reels */}
        <NavLink to="/feed" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ""}`}>
          <span className={styles.iconWrap}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="2" />
              <path d="M10 8l6 4-6 4V8z" />
            </svg>
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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            {chatUnread > 0 && <span className={styles.badge}>{chatUnread}</span>}
          </span>
          <span className={styles.label}>Chat</span>
        </NavLink>

        {/* Search */}
        <NavLink to="/search" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ""}`}>
          <span className={styles.iconWrap}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
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
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
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
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
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
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <span className={styles.label}>{user.username || "Account"}</span>
          </NavLink>
        ) : (
          <NavLink to="/auth" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ""}`}>
            <span className={styles.iconWrap}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <span className={styles.label}>Sign In</span>
          </NavLink>
        )}
      </div>

      <div className={styles.bottom}>
        {/* Sound toggle */}
        <button className={styles.navItem} onClick={() => setEnabled(!enabled)} title={enabled ? "Mute sounds" : "Enable sounds"}>
          <span className={styles.iconWrap}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {enabled ? (
                <>
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 010 14.14" />
                  <path d="M15.54 8.46a5 5 0 010 7.07" />
                </>
              ) : (
                <>
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </>
              )}
            </svg>
          </span>
          <span className={styles.label}>{enabled ? "Sound On" : "Sound Off"}</span>
        </button>

        {/* More */}
        <div className={styles.moreWrapper} ref={moreRef}>
          <button
            className={`${styles.navItem} ${moreOpen ? styles.active : ""}`}
            onClick={() => setMoreOpen((o) => !o)}
          >
            <span className={styles.iconWrap}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </span>
            <span className={styles.label}>More</span>
          </button>

          <AnimatePresence>
            {moreOpen && (
              <motion.div
                className={styles.morePopup}
                initial={{ opacity: 0, x: -10, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -10, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              >
                <MoreMenu
                  onLogout={() => {
                    setMoreOpen(false);
                    logout();
                    navigate("/");
                  }}
                  onClose={() => setMoreOpen(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
}
