import {
  GridFour,
  MonitorPlay,
  Briefcase,
} from "@phosphor-icons/react";
import { TabBar, type TabItem } from "@/components/TabBar/TabBar";
import styles from "./ProfileTabs.module.scss";

export type ProfileTab = "posts" | "video" | "vacancies";

interface ProfileTabsProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
}

const tabs: TabItem[] = [
  {
    id: "posts",
    label: "Posts",
    icon: <GridFour size={22} />,
    activeIcon: <GridFour size={22} weight="fill" />,
  },
  {
    id: "video",
    label: "Video",
    icon: <MonitorPlay size={22} />,
    activeIcon: <MonitorPlay size={22} weight="fill" />,
  },
  {
    id: "vacancies",
    label: "Vacancies",
    icon: <Briefcase size={22} />,
    activeIcon: <Briefcase size={22} weight="fill" />,
  },
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
