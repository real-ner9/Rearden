import { motion } from "motion/react";
import styles from "./ProfileTabs.module.scss";

export type ProfileTab = "posts" | "video" | "vacancies";

interface ProfileTabsProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
}

const tabs: { key: ProfileTab; label: string }[] = [
  { key: "posts", label: "Posts" },
  { key: "video", label: "Video" },
  { key: "vacancies", label: "Vacancies" },
];

export function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  return (
    <div className={styles.tabBar}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`${styles.tab} ${activeTab === tab.key ? styles.active : ""}`}
          onClick={() => onTabChange(tab.key)}
        >
          {tab.label}
          {activeTab === tab.key && (
            <motion.div
              className={styles.indicator}
              layoutId="profileTabIndicator"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
