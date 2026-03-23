import styles from "./ChatEmptyState.module.scss";

export function ChatEmptyState() {
  return (
    <div className={styles.empty}>
      <svg
        className={styles.icon}
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      <h3 className={styles.title}>Select a conversation</h3>
      <p className={styles.subtitle}>
        Choose a conversation from the list to start messaging
      </p>
    </div>
  );
}
