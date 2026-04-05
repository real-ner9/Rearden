import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "@phosphor-icons/react";
import type { VacancyDetail as VacancyDetailType, ApiResponse } from "@rearden/types";
import { apiFetch } from "@/lib/api";
import styles from "./VacancyDetail.module.scss";

const typeLabels = {
  fulltime: "Full-time",
  parttime: "Part-time",
  contract: "Contract",
  freelance: "Freelance",
};

export function VacancyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vacancy, setVacancy] = useState<VacancyDetailType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiFetch<ApiResponse<VacancyDetailType>>(`/vacancies/${id}`)
      .then((res) => setVacancy(res.data ?? null))
      .catch(() => setVacancy(null))
      .finally(() => setLoading(false));
  }, [id]);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days > 30) return `${Math.floor(days / 30)}mo ago`;
    if (days > 0) return `${days}d ago`;
    const hours = Math.floor(diff / 3600000);
    if (hours > 0) return `${hours}h ago`;
    return "just now";
  };

  const handleAuthorClick = () => {
    if (vacancy?.author) {
      navigate(`/user/${vacancy.author.id}`);
    }
  };

  const handleAuthorKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleAuthorClick();
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <span className={styles.headerTitle}>Vacancy</span>
        </header>
        <div className={styles.loading}>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  if (!vacancy) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <span className={styles.headerTitle}>Vacancy</span>
        </header>
        <div className={styles.notFound}>Vacancy not found</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <span className={styles.headerTitle}>Vacancy</span>
      </header>

      <div className={styles.content}>
        <div className={styles.titleRow}>
          <h1 className={styles.vacancyTitle}>{vacancy.title}</h1>
          <span className={`${styles.badge} ${styles[vacancy.type]}`}>
            {typeLabels[vacancy.type]}
          </span>
        </div>

        <div className={styles.metaRow}>
          <span>{vacancy.location}</span>
          <span>{timeAgo(vacancy.createdAt)}</span>
        </div>

        <div
          className={styles.authorCard}
          onClick={handleAuthorClick}
          onKeyDown={handleAuthorKeyDown}
          role="button"
          tabIndex={0}
        >
          <img
            src={vacancy.author.thumbnailUrl || "/placeholder-avatar.jpg"}
            alt={vacancy.author.name || "Author"}
            className={styles.authorAvatar}
          />
          <div className={styles.authorInfo}>
            <span className={styles.authorName}>
              {vacancy.author.name || vacancy.author.username || "Anonymous"}
            </span>
            {vacancy.author.title && (
              <span className={styles.authorTitle}>{vacancy.author.title}</span>
            )}
          </div>
        </div>

        <p className={styles.descriptionFull}>{vacancy.description}</p>

        <button className={styles.messageBtn} onClick={() => navigate("/chat")}>
          Message
        </button>
      </div>
    </div>
  );
}
