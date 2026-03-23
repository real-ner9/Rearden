import { motion } from "motion/react";
import styles from "./ChatTypingIndicator.module.scss";

interface ChatTypingIndicatorProps {
  name: string;
}

export function ChatTypingIndicator({ name }: ChatTypingIndicatorProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.bubble}>
        <span className={styles.label}>{name} is typing</span>
        <div className={styles.dots}>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className={styles.dot}
              animate={{ y: [0, -4, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
