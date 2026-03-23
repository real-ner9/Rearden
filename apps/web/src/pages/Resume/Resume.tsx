import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import type { Candidate } from "@rearden/types";

import { Button } from "@/components/Button/Button";
import { useApi } from "@/hooks/useApi";
import styles from "./Resume.module.scss";

export function Resume() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: candidate, loading, error } = useApi<Candidate>(`/candidates/${id}`);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Loading resume...</p>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className={styles.error}>
        <h2>Resume not found</h2>
        <Button variant="secondary" onClick={() => navigate("/search")}>
          Back to Search
        </Button>
      </div>
    );
  }

  if (!candidate.resumeText) {
    return (
      <div className={styles.error}>
        <h2>No resume available</h2>
        <p>This candidate hasn't uploaded a resume yet.</p>
        <Button variant="secondary" onClick={() => navigate(`/candidate/${id}`)}>
          Back to Profile
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.resume}>
      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className={styles.headerContent}>
          <h1 className={styles.name}>{candidate.name}</h1>
          <p className={styles.title}>{candidate.title}</p>
        </div>
      </motion.div>

      <motion.div
        className={styles.body}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
      >
        <div className={styles.text}>{candidate.resumeText}</div>
      </motion.div>

      <motion.div
        className={styles.actions}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.2 }}
      >
        {candidate.resumeUrl && (
          <Button
            variant="primary"
            href={candidate.resumeUrl}
          >
            Download Resume
          </Button>
        )}
        <Link to={`/candidate/${id}`} className={styles.backLink}>
          Back to Profile
        </Link>
      </motion.div>
    </div>
  );
}
