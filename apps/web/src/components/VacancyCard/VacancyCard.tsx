import type { Vacancy, VacancyAuthor } from "@rearden/types";
import styles from "./VacancyCard.module.scss";

interface VacancyCardProps {
  vacancy: Vacancy;
  author?: VacancyAuthor;
  onClick?: () => void;
}

const typeLabels: Record<Vacancy["type"], string> = {
  fulltime: "Full-time",
  parttime: "Part-time",
  contract: "Contract",
  freelance: "Freelance",
};

export function VacancyCard({ vacancy, author, onClick }: VacancyCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={`${styles.card} ${onClick ? styles.clickable : ""}`}
      onClick={handleClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={handleKeyDown}
    >
      {author && (
        <div className={styles.authorRow}>
          <img
            src={author.thumbnailUrl || "/placeholder-avatar.jpg"}
            alt={author.name || "Author"}
            className={styles.authorAvatar}
          />
          <div className={styles.authorInfo}>
            <span className={styles.authorName}>
              {author.name || author.username || "Anonymous"}
            </span>
            {author.title && (
              <span className={styles.authorTitle}>{author.title}</span>
            )}
          </div>
        </div>
      )}
      <div className={styles.header}>
        <h3 className={styles.title}>{vacancy.title}</h3>
        <span className={`${styles.badge} ${styles[vacancy.type]}`}>
          {typeLabels[vacancy.type]}
        </span>
      </div>
      <p className={onClick ? styles.descriptionClamped : styles.description}>
        {vacancy.description}
      </p>
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
