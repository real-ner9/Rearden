import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import type { User, Post, VideoPost, Vacancy } from "@rearden/types";

import { ProfileTabs, type ProfileTab } from "@/components/ProfileTabs/ProfileTabs";
import { PostGrid } from "@/components/PostGrid/PostGrid";
import { VideoGrid } from "@/components/VideoGrid/VideoGrid";
import { VacancyCard } from "@/components/VacancyCard/VacancyCard";
import { SkillTag } from "@/components/SkillTag/SkillTag";
import { Button } from "@/components/Button/Button";
import { useApi } from "@/hooks/useApi";
import styles from "./MyProfile.module.scss";

const availabilityLabels: Record<string, string> = {
  immediate: "Available immediately",
  "2weeks": "Available in 2 weeks",
  "1month": "Available in 1 month",
  "3months": "Available in 3 months",
};

export function MyProfile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");

  const { data: profile, loading, error } = useApi<User>("/me/profile");

  const userId = profile?.id;
  const { data: posts } = useApi<Post[]>(
    userId ? `/posts?userId=${userId}` : "",
  );
  const { data: videoPosts } = useApi<VideoPost[]>(
    userId ? `/posts?userId=${userId}&type=video` : "",
  );
  const { data: vacancies } = useApi<Vacancy[]>(
    userId ? `/vacancies?userId=${userId}` : "",
  );

  // No profile name — go to edit page to fill in
  useEffect(() => {
    if (!loading && profile && !profile.name) {
      navigate("/profile/edit", { replace: true });
    }
  }, [loading, profile, navigate]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return null;
  }

  const displaySkills =
    profile.topSkills.length > 0 ? profile.topSkills : profile.skills;

  return (
    <div className={styles.profile}>
      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <h1 className={styles.name}>{profile.name}</h1>

        <div className={styles.meta}>
          <span>{profile.title}</span>
          <span className={styles.dot} />
          <span>{profile.location}</span>
          <span className={styles.dot} />
          <span>
            {profile.experience} yr{profile.experience !== 1 ? "s" : ""} exp
          </span>
          <span className={styles.dot} />
          <span>{availabilityLabels[profile.availability]}</span>
        </div>

        <p className={styles.bio}>{profile.bio}</p>

        <div className={styles.skills}>
          {displaySkills.slice(0, 13).map((skill) => (
            <SkillTag key={skill} skill={skill} size="sm" />
          ))}
        </div>

        <div className={styles.actions}>
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate("/profile/edit")}
          >
            Edit Profile
          </Button>
          {profile.resumeText && (
            <Link to={`/user/${profile.id}/resume`} className={styles.resumeLink}>
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
            onVideoClick={(pid) => navigate(`/user/${profile.id}/reel/${pid}`)}
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
    </div>
  );
}
