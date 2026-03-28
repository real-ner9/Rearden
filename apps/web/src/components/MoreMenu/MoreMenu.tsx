import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import styles from "./MoreMenu.module.scss";

interface MoreMenuProps {
  onLogout: () => void;
  onClose: () => void;
}

export function MoreMenu({ onLogout, onClose }: MoreMenuProps) {
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  const handleLogout = () => {
    if (confirmingLogout) {
      onLogout();
      return;
    }
    setConfirmingLogout(true);
  };

  const cancelLogout = () => {
    setConfirmingLogout(false);
  };

  return (
    <div className={styles.menu}>
      <AnimatePresence mode="wait">
        {confirmingLogout ? (
          <motion.div
            key="confirm"
            className={styles.confirmPanel}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <p className={styles.confirmText}>Log out of your account?</p>
            <div className={styles.confirmActions}>
              <button className={styles.confirmBtn} onClick={handleLogout}>
                Log out
              </button>
              <button className={styles.cancelBtn} onClick={cancelLogout}>
                Cancel
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="items"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <div className={styles.section}>
              <button className={styles.item} onClick={onClose}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
                Settings
              </button>

              <button className={styles.item} onClick={onClose}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Your activity
              </button>

              <button className={styles.item} onClick={onClose}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                </svg>
                Saved
              </button>

              <button className={styles.item} onClick={onClose}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
                Switch mode
              </button>

              <button className={styles.item} onClick={onClose}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                Report a problem
              </button>
            </div>

            <div className={styles.separator} />

            <div className={styles.section}>
              <button className={styles.item} onClick={onClose}>
                Switch accounts
              </button>
            </div>

            <div className={styles.separator} />

            <div className={styles.section}>
              <button className={`${styles.item} ${styles.logout}`} onClick={handleLogout}>
                Log out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
