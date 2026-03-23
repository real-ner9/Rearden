import { motion } from "motion/react";
import type { ChatTab } from "@rearden/types";
import { useChat } from "@/contexts/ChatContext";
import styles from "./ChatTabBar.module.scss";

const TABS: { value: ChatTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "pinned", label: "Pinned" },
];

export function ChatTabBar() {
  const { activeTab, setActiveTab } = useChat();

  return (
    <div className={styles.tabs}>
      {TABS.map((tab) => (
        <button
          key={tab.value}
          className={`${styles.tab} ${activeTab === tab.value ? styles.active : ""}`}
          onClick={() => setActiveTab(tab.value)}
        >
          {tab.label}
          {activeTab === tab.value && (
            <motion.div
              layoutId="chatTabIndicator"
              className={styles.indicator}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
