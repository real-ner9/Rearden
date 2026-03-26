import { motion } from "motion/react";
import type { User } from "@rearden/types";
import { ScoreBadge } from "@/components/ScoreBadge/ScoreBadge";
import styles from "./UserCard.module.scss";

interface UserCardProps {
  user: User;
  score?: number;
  matchReason?: string;
  onClick?: () => void;
}

export function UserCard({
  user,
  score,
  matchReason,
  onClick,
}: UserCardProps) {
  return (
    <motion.div
      className={styles.card}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className={styles.thumbnail}>
        {user.thumbnailUrl ? (
          <img src={user.thumbnailUrl} alt={user.name ?? ""} />
        ) : (
          <div className={styles.placeholder} />
        )}

        {/* Play icon overlay */}
        {user.videoUrl && (
          <div className={styles.playIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}

        {score !== undefined && (
          <div className={styles.scoreBadge}>
            <ScoreBadge score={score} />
          </div>
        )}

        {/* Bottom gradient + info overlay */}
        <div className={styles.gradient} />
        <div className={styles.overlay}>
          <h3 className={styles.name}>{user.name}</h3>
          <p className={styles.title}>{user.title}</p>
          <div className={styles.skills}>
            {user.skills.slice(0, 3).map((skill) => (
              <span key={skill} className={styles.skillChip}>
                #{skill.toLowerCase().replace(/\s+/g, "")}
              </span>
            ))}
          </div>
          {matchReason && (
            <p className={styles.matchReason}>{matchReason}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
