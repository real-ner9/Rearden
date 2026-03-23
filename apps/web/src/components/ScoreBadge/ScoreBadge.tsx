import styles from "./ScoreBadge.module.scss";

interface ScoreBadgeProps {
  score: number;
}

export function ScoreBadge({ score }: ScoreBadgeProps) {
  const variant = score >= 80 ? "high" : score >= 60 ? "medium" : "low";

  return (
    <div className={`${styles.badge} ${styles[variant]}`}>
      {score}% match
    </div>
  );
}
