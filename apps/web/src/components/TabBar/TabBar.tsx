import type { ReactNode } from "react";
import { motion } from "motion/react";
import styles from "./TabBar.module.scss";

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  activeIcon?: ReactNode;
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
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className={`${styles.tab} ${isActive ? styles.active : ""}`}
            onClick={() => onTabChange(tab.id)}
            aria-label={tab.label}
          >
            {tab.icon ? (isActive && tab.activeIcon ? tab.activeIcon : tab.icon) : tab.label}
            {isActive && (
              <motion.div
                className={styles.indicator}
                layoutId={layoutId}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
