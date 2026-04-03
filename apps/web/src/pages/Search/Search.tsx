import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { TabBar } from "@/components/TabBar/TabBar";
import { SearchContentTab } from "./SearchContentTab";
import { SearchAIMatchTab } from "./SearchAIMatchTab";
import { SearchPeopleTab } from "./SearchPeopleTab";
import styles from "./Search.module.scss";

const TABS = [
  { id: "content", label: "Content" },
  { id: "people", label: "People" },
  { id: "ai-match", label: "AI Match" },
];

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "content";

  const handleTabChange = (id: string) => {
    setSearchParams({ tab: id }, { replace: true });
  };

  return (
    <div className={styles.search}>
      <TabBar
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        layoutId="searchTabs"
      />
      <div className={styles.content}>
        <AnimatePresence mode="wait">
          {activeTab === "content" && (
            <motion.div
              key="content"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <SearchContentTab />
            </motion.div>
          )}
          {activeTab === "people" && (
            <motion.div
              key="people"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <SearchPeopleTab />
            </motion.div>
          )}
          {activeTab === "ai-match" && (
            <motion.div
              key="ai-match"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <SearchAIMatchTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
