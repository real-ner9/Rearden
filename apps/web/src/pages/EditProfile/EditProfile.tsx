import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import type { User } from "@rearden/types";

import { Button } from "@/components/Button/Button";
import { VideoUpload } from "@/components/VideoUpload/VideoUpload";
import { useVideoUpload } from "@/hooks/useVideoUpload";
import { useApi } from "@/hooks/useApi";
import { apiFetch } from "@/lib/api";
import styles from "./EditProfile.module.scss";

function getInitials(name: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function EditProfile() {
  const navigate = useNavigate();
  const { data: profile, loading } = useApi<User>("/me/profile");
  const { data: allSkillsData } = useApi<{ skills: string[] }>(
    profile ? "/me/profile/skills/all" : "",
  );

  const videoUpload = useVideoUpload();
  const resumeUpload = useVideoUpload();

  const [form, setForm] = useState({
    name: "",
    email: "",
    title: "",
    location: "",
    bio: "",
    experience: "",
    availability: "immediate",
  });
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [topSkills, setTopSkills] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragNode = useRef<HTMLDivElement | null>(null);

  // Pre-fill form when editing existing profile
  useEffect(() => {
    if (profile && !initialized) {
      setForm({
        name: profile.name ?? "",
        email: profile.email ?? "",
        title: profile.title,
        location: profile.location,
        bio: profile.bio,
        experience: String(profile.experience),
        availability: profile.availability,
      });
      setVideoUrl(profile.videoUrl);
      setResumeUrl(profile.resumeUrl);
      if (profile.resumeUrl) setResumeFileName("Current resume");
      setTopSkills(
        profile.topSkills.length > 0
          ? profile.topSkills
          : profile.skills.slice(0, 13),
      );
      setInitialized(true);
    }
  }, [profile, initialized]);

  const updateField =
    (field: string) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleVideoUpload = async (file: File) => {
    try {
      const url = await videoUpload.upload(file);
      setVideoUrl(url);
    } catch {
      /* handled by hook */
    }
  };

  const handleResumeUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await resumeUpload.upload(file);
      setResumeUrl(url);
      setResumeFileName(file.name);
    } catch {
      /* handled by hook */
    }
  };

  // Drag and drop
  const handleDragStart =
    (index: number) => (e: React.DragEvent<HTMLDivElement>) => {
      setDragIndex(index);
      dragNode.current = e.currentTarget;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(index));
      requestAnimationFrame(() => {
        dragNode.current?.classList.add(styles.skillChipDragging);
      });
    };

  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragIndex === null || dragIndex === index) return;
    setOverIndex(index);
  };

  const handleDragLeave = () => setOverIndex(null);

  const handleDrop = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setTopSkills((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragIndex(null);
    setOverIndex(null);
  };

  const handleDragEnd = () => {
    dragNode.current?.classList.remove(styles.skillChipDragging);
    setDragIndex(null);
    setOverIndex(null);
    dragNode.current = null;
  };

  const addSkill = (skill: string) => {
    if (topSkills.length >= 13) return;
    setTopSkills((prev) => [...prev, skill]);
  };

  const removeSkill = (index: number) => {
    setTopSkills((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);

    try {
      // UPDATE user profile
      await apiFetch("/me/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          title: form.title,
          location: form.location,
          bio: form.bio,
          experience: parseInt(form.experience) || 0,
          availability: form.availability,
          videoUrl,
          resumeUrl,
        }),
      });
      // Save skills order
      await apiFetch("/me/profile/skills", {
        method: "PUT",
        body: JSON.stringify({ skills: topSkills }),
      });

      navigate("/profile");
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to save profile",
      );
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Loading...</p>
      </div>
    );
  }

  const allSkills = allSkillsData?.skills ?? [];
  const availableSkills = allSkills.filter((s) => !topSkills.includes(s));
  const displayName = form.name || profile?.name || "";

  return (
    <div className={styles.page}>
      <motion.form
        className={styles.form}
        onSubmit={handleSave}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Profile card — avatar + name */}
        <div className={styles.profileCard}>
          <div className={styles.avatar}>
            {profile?.thumbnailUrl ? (
              <img
                src={profile.thumbnailUrl}
                alt={displayName}
                className={styles.avatarImg}
              />
            ) : (
              <span className={styles.avatarInitials}>
                {getInitials(displayName)}
              </span>
            )}
          </div>
          <div className={styles.cardInfo}>
            <span className={styles.cardName}>
              {displayName || "Your Name"}
            </span>
            <span className={styles.cardTitle}>
              {form.title || "Your Title"}
            </span>
          </div>
        </div>

        {/* Fields — single column, profile-like order */}
        <div className={styles.field}>
          <label className={styles.label}>Name</label>
          <input
            className={styles.input}
            value={form.name}
            onChange={updateField("name")}
            placeholder="Your full name"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Email</label>
          <input
            className={styles.input}
            type="email"
            value={form.email}
            onChange={updateField("email")}
            placeholder="your@email.com"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Job Title</label>
          <input
            className={styles.input}
            value={form.title}
            onChange={updateField("title")}
            placeholder="Senior Frontend Engineer"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Location</label>
          <input
            className={styles.input}
            value={form.location}
            onChange={updateField("location")}
            placeholder="San Francisco, CA"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Bio</label>
          <textarea
            className={styles.textarea}
            value={form.bio}
            onChange={updateField("bio")}
            placeholder="Tell others about yourself..."
            rows={3}
          />
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label className={styles.label}>Experience</label>
            <input
              className={styles.input}
              type="number"
              value={form.experience}
              onChange={updateField("experience")}
              placeholder="5"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Availability</label>
            <select
              className={styles.input}
              value={form.availability}
              onChange={updateField("availability")}
            >
              <option value="immediate">Immediately</option>
              <option value="2weeks">In 2 weeks</option>
              <option value="1month">In 1 month</option>
              <option value="3months">In 3 months</option>
            </select>
          </div>
        </div>

        {/* Skills */}
        <div className={styles.field}>
          <div className={styles.skillsHeader}>
            <label className={styles.label}>Top Skills</label>
            <span className={styles.skillsCount}>
              {topSkills.length} / 13
            </span>
          </div>
          <div className={styles.skillsList}>
            {topSkills.map((skill, index) => (
              <div
                key={skill}
                className={`${styles.skillChip} ${overIndex === index ? styles.skillChipOver : ""}`}
                draggable
                onDragStart={handleDragStart(index)}
                onDragOver={handleDragOver(index)}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop(index)}
                onDragEnd={handleDragEnd}
              >
                <span className={styles.dragHandle}>
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <circle cx="9" cy="5" r="2" />
                    <circle cx="15" cy="5" r="2" />
                    <circle cx="9" cy="12" r="2" />
                    <circle cx="15" cy="12" r="2" />
                    <circle cx="9" cy="19" r="2" />
                    <circle cx="15" cy="19" r="2" />
                  </svg>
                </span>
                {skill}
                <button
                  type="button"
                  className={styles.removeSkill}
                  onClick={() => removeSkill(index)}
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
            {topSkills.length === 0 && (
              <span className={styles.emptySkills}>
                Add skills from your posts below
              </span>
            )}
          </div>

          {/* Manual skill input */}
          <SkillInput
            onAdd={(skill) => addSkill(skill)}
            disabled={topSkills.length >= 13}
          />

          {availableSkills.length > 0 && (
            <div className={styles.availableSkills}>
              <span className={styles.availableLabel}>From your posts:</span>
              <div className={styles.availableList}>
                {availableSkills.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    className={styles.availableChip}
                    onClick={() => addSkill(skill)}
                    disabled={topSkills.length >= 13}
                  >
                    + {skill}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Video */}
        <div className={styles.field}>
          <label className={styles.label}>Video Introduction</label>
          <VideoUpload
            onUpload={handleVideoUpload}
            uploading={videoUpload.uploading}
            progress={videoUpload.progress}
            previewUrl={videoUpload.previewUrl ?? videoUrl ?? undefined}
          />
        </div>

        {/* Resume */}
        <div className={styles.field}>
          <label className={styles.label}>Resume</label>
          <label className={styles.resumeDropzone}>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleResumeUpload}
              className={styles.hiddenInput}
            />
            {resumeUpload.uploading ? (
              <span className={styles.resumeStatus}>
                Uploading... {Math.round(resumeUpload.progress)}%
              </span>
            ) : resumeFileName ? (
              <span className={styles.resumeStatus}>
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
                </svg>
                {resumeFileName}
              </span>
            ) : (
              <span className={styles.resumeStatus}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Click to upload
              </span>
            )}
          </label>
        </div>

        {/* Error */}
        {saveError && (
          <p className={styles.error}>{saveError}</p>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          <Button variant="ghost" size="md" onClick={() => navigate("/profile")}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            type="submit"
            disabled={saving || !form.name || !form.email}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </motion.form>
    </div>
  );
}

// Small inline component for typing skills
function SkillInput({
  onAdd,
  disabled,
}: {
  onAdd: (skill: string) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && value.trim()) {
      e.preventDefault();
      onAdd(value.trim());
      setValue("");
    }
  };

  return (
    <input
      className={styles.skillInput}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={disabled ? "Max 13 skills" : "Type a skill and press Enter"}
      disabled={disabled}
    />
  );
}
