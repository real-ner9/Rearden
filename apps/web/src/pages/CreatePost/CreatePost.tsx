import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";

import { MediaUpload } from "@/components/MediaUpload/MediaUpload";
import { HashtagInput } from "@/components/HashtagInput/HashtagInput";
import { ToggleSwitch } from "@/components/ToggleSwitch/ToggleSwitch";
import { Button } from "@/components/Button/Button";
import { useVideoUpload } from "@/hooks/useVideoUpload";
import { useAuthStore } from "@/stores/authStore";
import { apiFetch } from "@/lib/api";
import type { CreatePostPayload } from "@rearden/types";
import styles from "./CreatePost.module.scss";

type PostType = "video" | "image";

export function CreatePost() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [step, setStep] = useState<1 | 2>(1);
  const [postType, setPostType] = useState<PostType>("video");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [crossPost, setCrossPost] = useState({
    instagram: false,
    shorts: false,
    tiktok: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const { upload, uploading, progress, previewUrl } = useVideoUpload();

  const handleFileUpload = async (file: File) => {
    try {
      const url = await upload(file);
      setMediaUrl(url);
    } catch {
      // upload error handled by hook
    }
  };

  const handleNext = () => {
    if (mediaUrl) setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleShare = async () => {
    if (!user || !mediaUrl) return;
    setSubmitting(true);

    // Combine caption with hashtags
    const hashtagStr = hashtags.map((t) => `#${t}`).join(" ");
    const fullContent = hashtagStr
      ? `${caption}\n\n${hashtagStr}`
      : caption;

    const payload: CreatePostPayload = {
      userId: user.id,
      type: postType,
      content: fullContent || "(no caption)",
      crossPostInstagram: crossPost.instagram,
      crossPostShorts: crossPost.shorts,
      crossPostTiktok: crossPost.tiktok,
    };

    if (postType === "video") {
      payload.videoUrl = mediaUrl;
    } else {
      payload.imageUrl = mediaUrl;
    }

    try {
      await apiFetch("/posts", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      navigate("/profile");
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className={styles.title}>Create {postType === "video" ? "Reel" : "Post"}</h1>
        <p className={styles.subtitle}>
          {step === 1
            ? "Choose type and upload your media"
            : "Add details before sharing"}
        </p>
      </motion.div>

      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        {step === 1 ? (
          <>
            <div className={styles.typeTabs}>
              <button
                className={`${styles.typeTab} ${postType === "video" ? styles.active : ""}`}
                onClick={() => {
                  setPostType("video");
                  setMediaUrl(null);
                }}
                type="button"
              >
                Reel
              </button>
              <button
                className={`${styles.typeTab} ${postType === "image" ? styles.active : ""}`}
                onClick={() => {
                  setPostType("image");
                  setMediaUrl(null);
                }}
                type="button"
              >
                Post
              </button>
            </div>

            <MediaUpload
              type={postType}
              onUpload={handleFileUpload}
              uploading={uploading}
              progress={progress}
              previewUrl={previewUrl ?? undefined}
            />

            <div className={styles.actions}>
              <span className={styles.stepIndicator}>Step 1 of 2</span>
              <Button
                variant="primary"
                size="md"
                onClick={handleNext}
                disabled={!mediaUrl || uploading}
              >
                Next
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className={styles.detailsTop}>
              {previewUrl && (
                postType === "video" ? (
                  <video
                    src={previewUrl}
                    className={styles.miniPreviewVideo}
                    muted
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className={styles.miniPreview}
                  />
                )
              )}
              <div className={styles.field}>
                <label className={styles.label}>Caption</label>
                <textarea
                  className={styles.textarea}
                  placeholder="Write a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            <HashtagInput tags={hashtags} onChange={setHashtags} />

            <div className={styles.divider} />

            <div className={styles.crossPostSection}>
              <span className={styles.crossPostTitle}>Cross-post to</span>
              <ToggleSwitch
                label="Instagram Reels"
                checked={crossPost.instagram}
                onChange={(v) => setCrossPost((p) => ({ ...p, instagram: v }))}
              />
              <ToggleSwitch
                label="YouTube Shorts"
                checked={crossPost.shorts}
                onChange={(v) => setCrossPost((p) => ({ ...p, shorts: v }))}
              />
              <ToggleSwitch
                label="TikTok"
                checked={crossPost.tiktok}
                onChange={(v) => setCrossPost((p) => ({ ...p, tiktok: v }))}
              />
            </div>

            <div className={styles.actions}>
              <Button variant="ghost" size="md" onClick={handleBack}>
                Back
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleShare}
                disabled={submitting}
              >
                {submitting ? "Sharing..." : "Share"}
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
