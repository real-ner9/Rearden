import styles from "./ChatDateDivider.module.scss";

interface ChatDateDividerProps {
  date: string;
}

export function ChatDateDivider({ date }: ChatDateDividerProps) {
  return (
    <div className={styles.divider}>
      <span className={styles.label}>{date}</span>
    </div>
  );
}
