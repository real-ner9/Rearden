import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import type { User, Post, Vacancy, VideoPost } from "@rearden/types";

import { ProfileTabs, type ProfileTab } from "@/components/ProfileTabs/ProfileTabs";
import { PostGrid } from "@/components/PostGrid/PostGrid";
import { VideoGrid } from "@/components/VideoGrid/VideoGrid";
import { ReelModal } from "@/components/ReelModal/ReelModal";
import { VacancyCard } from "@/components/VacancyCard/VacancyCard";
import { SkillTag } from "@/components/SkillTag/SkillTag";
import { Button } from "@/components/Button/Button";
import { useApi } from "@/hooks/useApi";
import { useChat } from "@/contexts/ChatContext";
import styles from "./UserProfile.module.scss";

const availabilityLabels: Record<string, string> = {
  immediate: "Available immediately",
  "2weeks": "Available in 2 weeks",
  "1month": "Available in 1 month",
  "3months": "Available in 3 months",
};

export function UserProfile() {
  const { id, postId } = useParams<{ id: string; postId?: string }>();
  const navigate = useNavigate();
  const { startConversation } = useChat();
  const [activeTab, setActiveTab] = useState<ProfileTab>(postId ? "video" : "posts");

  const { data: user, loading, error } = useApi<User>(`/users/${id}`);
  const { data: posts } = useApi<Post[]>(`/posts?userId=${id}`);
  const { data: videoPosts } = useApi<VideoPost[]>(`/posts?userId=${id}&type=video`);
  const { data: vacancies } = useApi<Vacancy[]>(`/vacancies?userId=${id}`);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className={styles.error}>
        <h2>User not found</h2>
        <p>The user you're looking for doesn't exist.</p>
        <Button variant="secondary" onClick={() => navigate("/search")}>
          Back to Search
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.profile}>
      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <h1 className={styles.name}>{user.name}</h1>

        <div className={styles.meta}>
          <span>{user.title}</span>
          <span className={styles.dot} />
          <span>{user.location}</span>
          <span className={styles.dot} />
          <span>
            {user.experience} yr{user.experience !== 1 ? "s" : ""} exp
          </span>
          <span className={styles.dot} />
          <span>{availabilityLabels[user.availability]}</span>
        </div>

        <p className={styles.bio}>{user.bio}</p>

        <div className={styles.skills}>
          {user.skills.map((skill) => (
            <SkillTag key={skill} skill={skill} size="sm" />
          ))}
        </div>

        <div className={styles.actions}>
          {user.resumeText && (
            <Link to={`/user/${id}/resume`} className={styles.resumeLink}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              Resume
            </Link>
          )}
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate("/create")}
          >
            + Create
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => startConversation(user.id, user.name ?? "")}
          >
            Contact
          </Button>
          <Button
            variant="ghost"
            size="md"
            onClick={() => navigate("/search")}
          >
            Back
          </Button>
        </div>
      </motion.div>

      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <motion.div
        className={styles.tabContent}
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {activeTab === "posts" && <PostGrid posts={posts ?? []} />}
        {activeTab === "video" && (
          <VideoGrid
            posts={videoPosts ?? []}
            onVideoClick={(pid) => navigate(`/user/${id}/reel/${pid}`)}
          />
        )}
        {activeTab === "vacancies" && (
          <div className={styles.vacancyList}>
            <div className={styles.vacancyHeader}>
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate("/vacancy/create")}
              >
                Post Vacancy
              </Button>
            </div>
            {vacancies && vacancies.length > 0 ? (
              vacancies.map((v) => <VacancyCard key={v.id} vacancy={v} />)
            ) : (
              <div className={styles.emptyTab}>
                <p>No vacancies posted</p>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {postId && (
        <ReelModal
          initialPostId={postId}
          userId={id}
          onClose={() => navigate(`/user/${id}`)}
        />
      )}
    </div>
  );
}
