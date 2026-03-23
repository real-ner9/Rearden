import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";

import { Input } from "@/components/Input/Input";
import { Button } from "@/components/Button/Button";
import { VideoUpload } from "@/components/VideoUpload/VideoUpload";
import { useVideoUpload } from "@/hooks/useVideoUpload";
import { apiFetch } from "@/lib/api";
import type { Candidate } from "@rearden/types";
import styles from "./Register.module.scss";

export function Register() {
  const navigate = useNavigate();
  const { upload, uploading, progress, previewUrl } = useVideoUpload();
  const [submitting, setSubmitting] = useState(false);
  const resumeUpload = useVideoUpload();
  const [form, setForm] = useState({
    name: "",
    email: "",
    title: "",
    location: "",
    bio: "",
    skills: "",
    experience: "",
  });

  const updateField = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);

  const handleVideoUpload = async (file: File) => {
    try {
      const url = await upload(file);
      setVideoUrl(url);
    } catch {
      // upload error handled by hook
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await resumeUpload.upload(file);
      setResumeUrl(url);
      setResumeFileName(file.name);
    } catch {
      // upload error handled by hook
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await apiFetch<{ success: boolean; data: Candidate }>(
        "/candidates",
        {
          method: "POST",
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            title: form.title,
            location: form.location,
            bio: form.bio,
            skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
            experience: parseInt(form.experience) || 0,
            videoUrl,
            resumeUrl,
            availability: "immediate",
          }),
        }
      );

      navigate(`/candidate/${response.data.id}`);
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.register}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className={styles.title}>Join Rearden</h1>
          <p className={styles.subtitle}>
            Create your video profile and get discovered by top recruiters
          </p>
        </motion.div>

        <motion.form
          className={styles.form}
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className={styles.formGrid}>
            <Input
              label="Full Name"
              placeholder="John Doe"
              value={form.name}
              onChange={updateField("name")}
            />
            <Input
              label="Email"
              type="email"
              placeholder="john@example.com"
              value={form.email}
              onChange={updateField("email")}
            />
            <Input
              label="Job Title"
              placeholder="Senior Frontend Engineer"
              value={form.title}
              onChange={updateField("title")}
            />
            <Input
              label="Location"
              placeholder="San Francisco, CA"
              value={form.location}
              onChange={updateField("location")}
            />
            <Input
              label="Years of Experience"
              type="number"
              placeholder="5"
              value={form.experience}
              onChange={updateField("experience")}
            />
            <Input
              label="Skills (comma separated)"
              placeholder="React, TypeScript, Node.js"
              value={form.skills}
              onChange={updateField("skills")}
            />
          </div>

          <div className={styles.bioField}>
            <label className={styles.label}>Bio</label>
            <textarea
              className={styles.textarea}
              placeholder="Tell recruiters about yourself, your experience, and what you're looking for..."
              value={form.bio}
              onChange={updateField("bio")}
              rows={4}
            />
          </div>

          <div className={styles.videoSection}>
            <label className={styles.label}>Video Introduction</label>
            <p className={styles.videoHint}>
              Record a 1-2 minute video introducing yourself
            </p>
            <VideoUpload
              onUpload={handleVideoUpload}
              uploading={uploading}
              progress={progress}
              previewUrl={previewUrl ?? undefined}
            />
          </div>

          <div className={styles.resumeSection}>
            <label className={styles.label}>Resume</label>
            <p className={styles.videoHint}>
              Upload your resume (PDF, DOC, DOCX, or TXT)
            </p>
            <div className={styles.resumeUpload}>
              <label className={styles.resumeDropzone}>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleResumeUpload}
                  className={styles.hiddenInput}
                />
                {resumeUpload.uploading ? (
                  <span className={styles.resumeProgress}>
                    Uploading... {Math.round(resumeUpload.progress)}%
                  </span>
                ) : resumeFileName ? (
                  <span className={styles.resumeFile}>
                    <svg
                      width="16"
                      height="16"
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
                  <span className={styles.resumePlaceholder}>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    Click to upload resume
                  </span>
                )}
              </label>
            </div>
          </div>

          <div className={styles.actions}>
            <Button
              variant="primary"
              size="lg"
              type="submit"
              disabled={submitting || !form.name || !form.email}
            >
              {submitting ? "Creating Profile..." : "Create Profile"}
            </Button>
          </div>
        </motion.form>
    </div>
  );
}
