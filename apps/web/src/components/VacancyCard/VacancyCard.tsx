import type { Vacancy } from "@rearden/types";
import styles from "./VacancyCard.module.scss";

interface VacancyCardProps {
  vacancy: Vacancy;
}

const typeLabels: Record<Vacancy["type"], string> = {
  fulltime: "Full-time",
  parttime: "Part-time",
  contract: "Contract",
  freelance: "Freelance",
};

export function VacancyCard({ vacancy }: VacancyCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>{vacancy.title}</h3>
        <span className={`${styles.badge} ${styles[vacancy.type]}`}>
          {typeLabels[vacancy.type]}
        </span>
      </div>
      <p className={styles.description}>{vacancy.description}</p>
      <div className={styles.meta}>
        <span className={styles.location}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {vacancy.location}
        </span>
      </div>
    </div>
  );
}
