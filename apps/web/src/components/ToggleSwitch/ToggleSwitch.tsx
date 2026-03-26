import { motion } from "motion/react";
import type { ReactNode } from "react";
import styles from "./ToggleSwitch.module.scss";

interface ToggleSwitchProps {
  label: string;
  icon?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ToggleSwitch({ label, icon, checked, onChange }: ToggleSwitchProps) {
  return (
    <div className={styles.toggle}>
      <div className={styles.labelWrap}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <span className={styles.label}>{label}</span>
      </div>
      <div
        className={`${styles.track} ${checked ? styles.active : ""}`}
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            onChange(!checked);
          }
        }}
      >
        <motion.div
          className={styles.knob}
          animate={{ left: checked ? 22 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </div>
    </div>
  );
}
