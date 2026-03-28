import { useMemo } from "react";
import { useChatStore } from "@/stores/chatStore";
import { TabBar, type TabItem } from "@/components/TabBar/TabBar";
import styles from "./ChatTabBar.module.scss";

export function ChatTabBar() {
  const activeTab = useChatStore((s) => s.activeTab);
  const setActiveTab = useChatStore((s) => s.setActiveTab);
  const folders = useChatStore((s) => s.folders);
  const setFolderSettingsOpen = useChatStore((s) => s.setFolderSettingsOpen);

  const tabs: TabItem[] = useMemo(
    () => [
      { id: "all", label: "All" },
      { id: "unread", label: "Unread" },
      ...folders.map((f) => ({ id: f.id, label: f.name })),
    ],
    [folders],
  );

  return (
    <div className={styles.tabBarWrapper}>
      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        layoutId="chatTabIndicator"
        className={styles.tabs}
      />
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
