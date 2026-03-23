import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useSidebar } from "@/contexts/SidebarContext";
import { NotificationPanel } from "@/components/NotificationPanel/NotificationPanel";
import { ChatPanel } from "@/components/ChatPanel/ChatPanel";
import styles from "./Sidebar.module.scss";

function SidebarContent() {
  return (
    <>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Notifications</h3>
        <NotificationPanel />
      </div>
      <div className={styles.divider} />
      <div className={styles.chatSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Chat</h3>
          <Link to="/chat" className={styles.openLink}>Open</Link>
        </div>
        <ChatPanel />
      </div>
    </>
  );
}

export function Sidebar() {
  const { open, close } = useSidebar();

  return (
    <>
      {/* Desktop: always visible */}
      <aside className={styles.sidebar}>
        <SidebarContent />
      </aside>

      {/* Mobile: drawer overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className={styles.overlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
            />
            <motion.aside
              className={styles.drawer}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
