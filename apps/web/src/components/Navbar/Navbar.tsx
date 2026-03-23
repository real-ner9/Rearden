import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useState, useRef, useEffect } from "react";
import { Logo } from "@/components/Logo/Logo";
import { useSound } from "@/hooks/useSound";
import { useNotifications } from "@/contexts/NotificationContext";
import { NotificationPanel } from "@/components/NotificationPanel/NotificationPanel";
import styles from "./Navbar.module.scss";

export function Navbar() {
  const { enabled, setEnabled, playSound } = useSound();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const prevPath = useRef(location.pathname);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (location.pathname !== prevPath.current) {
      playSound("navigate");
      prevPath.current = location.pathname;
    }
  }, [location.pathname, playSound]);

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

  return (
    <>
      {/* Desktop top navbar */}
      <nav className={styles.topNav}>
        <div className={styles.topContainer}>
          <NavLink to="/" className={styles.logoLink}>
            <Logo size="sm" />
          </NavLink>

          <div className={styles.topLinks}>
            <NavLink to="/feed" className={styles.topLink}>
              {({ isActive }) => (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  Feed
                  {isActive && (
                    <motion.div className={styles.topIndicator} layoutId="navIndicator" transition={{ type: "spring", stiffness: 380, damping: 30 }} />
                  )}
                </>
              )}
            </NavLink>

            <NavLink to="/search" className={styles.topLink}>
              {({ isActive }) => (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  Search
                  {isActive && (
                    <motion.div className={styles.topIndicator} layoutId="navIndicator" transition={{ type: "spring", stiffness: 380, damping: 30 }} />
                  )}
                </>
              )}
            </NavLink>

            <NavLink to="/chat" className={styles.topLink}>
              {({ isActive }) => (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                  Chat
                  {isActive && (
                    <motion.div className={styles.topIndicator} layoutId="navIndicator" transition={{ type: "spring", stiffness: 380, damping: 30 }} />
                  )}
                </>
              )}
            </NavLink>

            <NavLink to="/register" className={styles.topLink}>
              {({ isActive }) => (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Register
                  {isActive && (
                    <motion.div className={styles.topIndicator} layoutId="navIndicator" transition={{ type: "spring", stiffness: 380, damping: 30 }} />
                  )}
                </>
              )}
            </NavLink>
          </div>

          <div className={styles.topActions}>
            <div className={styles.notifWrapper} ref={notifRef}>
              <button
                className={styles.iconButton}
                onClick={() => setNotifOpen((o) => !o)}
                aria-label="Notifications"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
                {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    className={styles.notifPopup}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  >
                    <NotificationPanel />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              className={styles.iconButton}
              onClick={() => setEnabled(!enabled)}
              title={enabled ? "Mute sounds" : "Enable sounds"}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <nav className={styles.bottomNav}>
        <NavLink to="/" end className={styles.bottomTab}>
          {({ isActive }) => (
            <div className={`${styles.bottomTabInner} ${isActive ? styles.bottomActive : ""}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
          )}
        </NavLink>

        <NavLink to="/search" className={styles.bottomTab}>
          {({ isActive }) => (
            <div className={`${styles.bottomTabInner} ${isActive ? styles.bottomActive : ""}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
          )}
        </NavLink>

        <NavLink to="/feed" className={styles.bottomTab}>
          {({ isActive }) => (
            <div className={`${styles.bottomTabInner} ${isActive ? styles.bottomActive : ""}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill={isActive ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="2" />
                <path d="M10 8l6 4-6 4V8z" />
              </svg>
            </div>
          )}
        </NavLink>

        <NavLink to="/chat" className={styles.bottomTab}>
          {({ isActive }) => (
            <div className={`${styles.bottomTabInner} ${isActive ? styles.bottomActive : ""}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
          )}
        </NavLink>

        <NavLink to="/register" className={styles.bottomTab}>
          {({ isActive }) => (
            <div className={`${styles.bottomTabInner} ${isActive ? styles.bottomActive : ""}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          )}
        </NavLink>
      </nav>
    </>
  );
}
