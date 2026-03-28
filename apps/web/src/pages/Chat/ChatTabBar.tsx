import { motion } from "motion/react";
import { useChat } from "@/contexts/ChatContext";
import styles from "./ChatTabBar.module.scss";

export function ChatTabBar() {
  const { activeTab, setActiveTab, folders, setFolderSettingsOpen } = useChat();

  return (
    <div className={styles.tabBarWrapper}>
      <div className={styles.tabs}>
        {[
          { id: "all", label: "All" },
          { id: "unread", label: "Unread" },
          ...folders.map((f) => ({ id: f.id, label: f.name })),
        ].map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="chatTabIndicator"
                className={styles.indicator}
                layout="position"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>
      <button
        className={styles.settingsBtn}
        onClick={() => setFolderSettingsOpen(true)}
        title="Manage folders"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M6.5 1.75a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM6.5 8a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM8 12.75a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  );
}
