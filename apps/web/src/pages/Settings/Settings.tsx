import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft } from "@phosphor-icons/react";
import { MoreMenu } from "@/components/MoreMenu/MoreMenu";
import { useAuthStore } from "@/stores/authStore";
import styles from "./Settings.module.scss";

export function Settings() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const authUser = useAuthStore((s) => s.user);

  return (
    <motion.div
      className={styles.page}
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 35 }}
    >
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={22} weight="bold" />
        </button>
        <span className={styles.title}>Settings</span>
      </header>

      <div className={styles.content}>
        <MoreMenu
          onLogout={() => {
            logout();
            navigate("/");
          }}
          onClose={() => navigate(-1)}
          isAuthenticated={!!authUser}
        />
      </div>
    </motion.div>
  );
}
