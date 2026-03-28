import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import type { User } from "@rearden/types";

import { Button } from "@/components/Button/Button";
import { LocationInput } from "@/components/LocationInput/LocationInput";
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

  const avatarUpload = useVideoUpload();
  const resumeUpload = useVideoUpload();

  const [form, setForm] = useState({
    name: "",
    email: "",
    title: "",
    location: "",
    bio: "",
    experience: "",
  });
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarDragging, setAvatarDragging] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
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
      });
      setThumbnailUrl(profile.thumbnailUrl);
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

  const handleAvatarFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;
      setAvatarPreview(URL.createObjectURL(file));
      try {
        const url = await avatarUpload.upload(file);
        setThumbnailUrl(url);
      } catch {
        /* handled by hook */
      }
    },
    [avatarUpload],
  );

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
          thumbnailUrl,
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
          <div
            className={`${styles.avatarUpload} ${avatarDragging ? styles.avatarDragging : ""}`}
            onClick={() => avatarInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
              setAvatarDragging(true);
            }}
            onDragLeave={() => setAvatarDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setAvatarDragging(false);
              const file = e.dataTransfer.files[0];
              if (file) handleAvatarFile(file);
            }}
          >
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className={styles.hiddenInput}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAvatarFile(file);
              }}
            />
            <div className={styles.avatar}>
              {(avatarPreview || thumbnailUrl) ? (
                <img
                  src={avatarPreview || thumbnailUrl!}
                  alt={displayName}
                  className={styles.avatarImg}
                />
              ) : (
                <span className={styles.avatarInitials}>
                  {getInitials(displayName)}
                </span>
              )}
            </div>
            <div className={styles.avatarOverlay}>
              {avatarUpload.uploading ? (
                <svg className={styles.avatarProgress} viewBox="0 0 36 36" width="28" height="28">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15" fill="none" stroke="#fff" strokeWidth="3"
                    strokeDasharray={`${avatarUpload.progress * 0.9425} 94.25`}
                    strokeLinecap="round"
                    transform="rotate(-90 18 18)"
                  />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              )}
            </div>
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
          <LocationInput
            value={form.location}
            onChange={(v) => setForm((prev) => ({ ...prev, location: v }))}
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

        <div className={styles.field}>
          <label className={styles.label}>Experience (years)</label>
          <input
            className={styles.input}
            type="number"
            value={form.experience}
            onChange={updateField("experience")}
            placeholder="5"
          />
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
            disabled={saving}
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
