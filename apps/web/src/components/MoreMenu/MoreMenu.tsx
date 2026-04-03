import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Gear,
  ClockCounterClockwise,
  BookmarkSimple,
  Moon,
  WarningCircle,
} from "@phosphor-icons/react";
import styles from "./MoreMenu.module.scss";

interface MoreMenuProps {
  onLogout: () => void;
  onClose: () => void;
  isAuthenticated?: boolean;
}

export function MoreMenu({ onLogout, onClose, isAuthenticated = true }: MoreMenuProps) {
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
              {isAuthenticated && (
                <>
                  <button className={styles.item} onClick={onClose}>
                    <Gear size={18} weight="regular" />
                    Settings
                  </button>

                  <button className={styles.item} onClick={onClose}>
                    <ClockCounterClockwise size={18} weight="regular" />
                    Your activity
                  </button>

                  <button className={styles.item} onClick={onClose}>
                    <BookmarkSimple size={18} weight="regular" />
                    Saved
                  </button>
                </>
              )}

              <button className={styles.item} onClick={onClose}>
                <Moon size={18} weight="regular" />
                Switch mode
              </button>

              {isAuthenticated && (
                <button className={styles.item} onClick={onClose}>
                  <WarningCircle size={18} weight="regular" />
                  Report a problem
                </button>
              )}
            </div>

            {isAuthenticated && (
              <>
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
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
