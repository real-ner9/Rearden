import { motion } from "motion/react";
import styles from "./TabBar.module.scss";

export interface TabItem {
  id: string;
  label: string;
}

interface TabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  layoutId: string;
  className?: string;
}

export function TabBar({ tabs, activeTab, onTabChange, layoutId, className }: TabBarProps) {
  return (
    <div className={`${styles.tabBar} ${className ?? ""}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`${styles.tab} ${activeTab === tab.id ? styles.active : ""}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
          {activeTab === tab.id && (
            <motion.div
              className={styles.indicator}
              layoutId={layoutId}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
