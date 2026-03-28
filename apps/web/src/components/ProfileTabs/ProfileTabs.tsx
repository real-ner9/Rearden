import { TabBar, type TabItem } from "@/components/TabBar/TabBar";
import styles from "./ProfileTabs.module.scss";

export type ProfileTab = "posts" | "video" | "vacancies";

interface ProfileTabsProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
}

const tabs: TabItem[] = [
  { id: "posts", label: "Posts" },
  { id: "video", label: "Video" },
  { id: "vacancies", label: "Vacancies" },
];

export function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  return (
    <TabBar
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(id) => onTabChange(id as ProfileTab)}
      layoutId="profileTabIndicator"
      className={styles.tabBar}
    />
  );
}
