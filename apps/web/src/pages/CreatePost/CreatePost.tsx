import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";

import { MediaUpload } from "@/components/MediaUpload/MediaUpload";
import { VideoPlayer } from "@/components/VideoPlayer/VideoPlayer";
import { ToggleSwitch } from "@/components/ToggleSwitch/ToggleSwitch";
import { Input } from "@/components/Input/Input";
import { Button } from "@/components/Button/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog/ConfirmDialog";
import { ImageCropModal } from "@/components/ImageCropModal/ImageCropModal";
import { useVideoUpload } from "@/hooks/useVideoUpload";
import { useMultiUpload } from "@/hooks/useMultiUpload";
import { useAuthStore } from "@/stores/authStore";
import { apiFetch } from "@/lib/api";
import { extractFrames, type FrameData } from "@/utils/videoFrames";
import type { CreatePostPayload, Vacancy } from "@rearden/types";
import styles from "./CreatePost.module.scss";

type CreateTab = "reels" | "post" | "vacancy";

export function CreatePost() {
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as CreateTab) || "reels";
  const [activeTab, setActiveTab] = useState<CreateTab>(
    ["reels", "post", "vacancy"].includes(initialTab) ? initialTab : "reels",
  );

  const isDirtyRef = useRef(false);
  const [pendingTab, setPendingTab] = useState<CreateTab | null>(null);
  const [showTabConfirm, setShowTabConfirm] = useState(false);

  const handleTabClick = (tab: CreateTab) => {
    if (tab === activeTab) return;
    if (isDirtyRef.current) {
      setPendingTab(tab);
      setShowTabConfirm(true);
    } else {
      setActiveTab(tab);
    }
  };

  const confirmTabSwitch = () => {
    setShowTabConfirm(false);
    isDirtyRef.current = false;
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  };

  const markDirty = useCallback((dirty: boolean) => {
    isDirtyRef.current = dirty;
  }, []);

  return (
    <div className={styles.page}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "reels" ? styles.activeTab : ""}`}
            onClick={() => handleTabClick("reels")}
            type="button"
          >
            Reels
          </button>
          <button
            className={`${styles.tab} ${activeTab === "post" ? styles.activeTab : ""}`}
            onClick={() => handleTabClick("post")}
            type="button"
          >
            Post
          </button>
          <button
            className={`${styles.tab} ${activeTab === "vacancy" ? styles.activeTab : ""}`}
            onClick={() => handleTabClick("vacancy")}
            type="button"
          >
            Vacancy
          </button>
        </div>

        {activeTab === "reels" && <ReelsForm onDirtyChange={markDirty} />}
        {activeTab === "post" && <PostForm onDirtyChange={markDirty} />}
        {activeTab === "vacancy" && <VacancyForm onDirtyChange={markDirty} />}
      </motion.div>

      {showTabConfirm && (
        <ConfirmDialog
          title="Switch tab?"
          message="You have unsaved changes. Switching tabs will discard your current work."
          confirmLabel="Switch"
          cancelLabel="Stay"
          onConfirm={confirmTabSwitch}
          onCancel={() => {
            setShowTabConfirm(false);
            setPendingTab(null);
          }}
        />
      )}
    </div>
  );
}

/* ───────────── Image thumbnail (pure presentational) ───────────── */

function ImageThumbnail({ url, onRemove, progress, uploading, isDragOverlay }: {
  url: string;
  onRemove?: () => void;
  progress?: number;
  uploading?: boolean;
  isDragOverlay?: boolean;
}) {
  return (
    <div className={`${styles.imageThumbnail} ${isDragOverlay ? styles.dragOverlayThumb : ""}`}>
      <img src={url} alt="" />
      {onRemove && (
        <button
          className={styles.removeBtn}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          type="button"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
      {uploading && (
        <div className={styles.progressOverlay}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────── Sortable wrapper (DnD) ───────────── */

interface SortableImageProps {
  id: string;
  url: string;
  progress: number;
  uploading: boolean;
  onRemove: () => void;
}

function SortableImage({ id, url, progress, uploading, onRemove }: SortableImageProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  // Active (dragged) item: no transform — DragOverlay handles the visual.
  // Non-active items: apply shift transform so neighbours animate into place.
  const style: React.CSSProperties = isDragging
    ? { opacity: 0.3 }
    : {
        transform: transform ? `translate3d(${transform.x}px, 0, 0)` : undefined,
        transition,
      };

  return (
    <div ref={setNodeRef} style={style} className={styles.sortableItem} {...attributes} {...listeners}>
      <ImageThumbnail
        url={url}
        progress={progress}
        uploading={uploading}
        onRemove={onRemove}
      />
    </div>
  );
}

/* ───────────── Reels (3-step: Upload → Publish → Cover Editor) ───────────── */

function ReelsForm({ onDirtyChange }: { onDirtyChange: (dirty: boolean) => void }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Video upload
  const {
    upload: uploadVideo,
    uploading: videoUploading,
    progress: videoProgress,
    previewUrl: videoPreviewUrl,
  } = useVideoUpload();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // Frames / cover scrubber
  const [frames, setFrames] = useState<FrameData[]>([]);
  const [duration, setDuration] = useState(0);
  const [coverTime, setCoverTime] = useState(0);
  const [coverBlob, setCoverBlob] = useState<Blob | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const coverPreviewUrlRef = useRef<string | null>(null);
  const scrubVideoRef = useRef<HTMLVideoElement>(null);
  const scrubCanvasRef = useRef<HTMLCanvasElement>(null);
  const scrubTrackRef = useRef<HTMLDivElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);

  // Step 2 — publish
  const [caption, setCaption] = useState("");
  const [crossPost, setCrossPost] = useState({
    instagram: false,
    shorts: false,
    tiktok: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);
  const [showCoverDiscard, setShowCoverDiscard] = useState(false);

  // Snapshot of cover state before entering step 3
  const savedCoverRef = useRef<{ blob: Blob | null; url: string | null }>({ blob: null, url: null });

  // Track dirty state for tab-switch confirmation
  useEffect(() => {
    onDirtyChange(!!videoPreviewUrl || caption.trim().length > 0);
  }, [videoPreviewUrl, caption, onDirtyChange]);

  // Extract frames for filmstrip background
  useEffect(() => {
    if (videoPreviewUrl && frames.length === 0) {
      extractFrames(videoPreviewUrl, 12).then((extracted) => {
        setFrames(extracted);
      });
    }
  }, [videoPreviewUrl, frames.length]);

  // Get video duration
  useEffect(() => {
    if (videoPreviewUrl && duration === 0) {
      const vid = document.createElement("video");
      vid.src = videoPreviewUrl;
      vid.addEventListener("loadedmetadata", () => {
        setDuration(vid.duration);
      });
    }
  }, [videoPreviewUrl, duration]);

  // Capture cover frame when scrub video seeks (attach once, use ref for cleanup)
  useEffect(() => {
    const video = scrubVideoRef.current;
    const canvas = scrubCanvasRef.current;
    if (!video || !canvas) return;

    const handleSeeked = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (!vw || !vh) return;

      // Use native video resolution, capped at 1080px on longest side
      const maxDim = 1080;
      const scale = Math.min(1, maxDim / Math.max(vw, vh));
      const cw = Math.round(vw * scale);
      const ch = Math.round(vh * scale);
      canvas.width = cw;
      canvas.height = ch;
      ctx.drawImage(video, 0, 0, cw, ch);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            setCoverBlob(blob);
            if (coverPreviewUrlRef.current) URL.revokeObjectURL(coverPreviewUrlRef.current);
            const newUrl = URL.createObjectURL(blob);
            coverPreviewUrlRef.current = newUrl;
            setCoverPreviewUrl(newUrl);
          }
        },
        "image/webp",
        0.95,
      );
    };

    video.addEventListener("seeked", handleSeeked);

    // Auto-capture first frame as default cover once video data is ready
    const captureFirst = () => {
      if (!coverPreviewUrlRef.current) {
        handleSeeked();
      }
    };
    if (video.readyState >= 2) {
      captureFirst();
    } else {
      video.addEventListener("loadeddata", captureFirst, { once: true });
    }

    return () => {
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("loadeddata", captureFirst);
    };
  }, [videoPreviewUrl]);

  // Seek scrub video when coverTime changes
  useEffect(() => {
    if (scrubVideoRef.current && duration > 0) {
      scrubVideoRef.current.currentTime = coverTime;
    }
  }, [coverTime, duration]);

  // Cleanup
  const framesRef = useRef(frames);
  framesRef.current = frames;

  useEffect(() => {
    return () => {
      framesRef.current.forEach((f) => URL.revokeObjectURL(f.url));
      if (coverPreviewUrlRef.current) URL.revokeObjectURL(coverPreviewUrlRef.current);
    };
  }, []);

  // Scrubber drag handler
  const handleScrubPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!scrubTrackRef.current || duration === 0) return;
      e.preventDefault();
      const el = e.currentTarget as HTMLElement;
      el.setPointerCapture(e.pointerId);

      const getTime = (clientX: number) => {
        const rect = scrubTrackRef.current!.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        return ratio * duration;
      };

      setCoverTime(getTime(e.clientX));

      const onMove = (ev: PointerEvent) => {
        setCoverTime(getTime(ev.clientX));
      };
      const onUp = () => {
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerup", onUp);
      };
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerup", onUp);
    },
    [duration],
  );

  const handleVideoFile = useCallback(
    async (files: File[]) => {
      const video = files.find((f) => f.type.startsWith("video/"));
      if (!video) return;
      setFrames([]);
      setCoverTime(0);
      setCoverBlob(null);
      setCoverPreviewUrl(null);
      setDuration(0);
      try {
        const url = await uploadVideo(video);
        setVideoUrl(url);
      } catch {
        /* handled by hook */
      }
    },
    [uploadVideo],
  );

  const handleCustomCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    e.target.value = "";
    setCoverBlob(file);
    if (coverPreviewUrlRef.current) URL.revokeObjectURL(coverPreviewUrlRef.current);
    const newUrl = URL.createObjectURL(file);
    coverPreviewUrlRef.current = newUrl;
    setCoverPreviewUrl(newUrl);
  };

  const handleBackStep1 = () => {
    if (videoPreviewUrl) {
      setShowDiscard(true);
    }
  };

  const handleDiscard = () => {
    setShowDiscard(false);
    navigate(-1);
  };

  // Upload cover blob
  const uploadBlob = async (blob: Blob, filename: string): Promise<string> => {
    const formData = new FormData();
    formData.append("file", blob, filename);
    const token = useAuthStore.getState().token;
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const json = await res.json();
    return json.data.url;
  };

  const handleShare = async () => {
    if (!user || !videoUrl) return;
    setSubmitting(true);

    const payload: CreatePostPayload = {
      userId: user.id,
      type: "video",
      content: caption.trim() || "(no caption)",
      videoUrl,
      crossPostInstagram: crossPost.instagram,
      crossPostShorts: crossPost.shorts,
      crossPostTiktok: crossPost.tiktok,
    };

    if (coverBlob) {
      payload.thumbnailUrl = await uploadBlob(coverBlob, "cover.webp");
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

  const canNext = videoUrl !== null && !videoUploading;

  return (
    <div className={styles.card}>
      {/* Hidden video + canvas for cover frame capture (always present) */}
      {videoPreviewUrl && (
        <video
          ref={scrubVideoRef}
          src={videoPreviewUrl}
          muted
          playsInline
          preload="auto"
          className={styles.hiddenMedia}
        />
      )}
      <canvas ref={scrubCanvasRef} className={styles.hiddenMedia} />

      {/* ── Step 1: Upload ── */}
      {step === 1 && (
        <>
          {!videoPreviewUrl && (
            <MediaUpload
              onUpload={handleVideoFile}
              uploading={videoUploading}
              progress={videoProgress}
              accept="video/*"
            />
          )}

          {videoPreviewUrl && (
            <div className={styles.videoPreviewWrap}>
              <VideoPlayer src={videoPreviewUrl} compact />
              {videoUploading && (
                <div className={styles.progressOverlay}>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${videoProgress}%` }}
                    />
                  </div>
                  <span className={styles.progressText}>{Math.round(videoProgress)}%</span>
                </div>
              )}
            </div>
          )}

          <div className={styles.actions}>
            {videoPreviewUrl ? (
              <Button variant="ghost" size="md" onClick={handleBackStep1}>
                Back
              </Button>
            ) : (
              <span />
            )}
            <Button variant="primary" size="md" onClick={() => setStep(2)} disabled={!canNext}>
              Next
            </Button>
          </div>
        </>
      )}

      {/* ── Step 2: Publish ── */}
      {step === 2 && (
        <>
          <div className={styles.coverWrap}>
            {coverPreviewUrl ? (
              <img src={coverPreviewUrl} alt="Cover" className={styles.reelsCoverPreview} />
            ) : videoPreviewUrl ? (
              <video
                src={videoPreviewUrl}
                className={styles.reelsCoverPreview}
                muted
                playsInline
                preload="metadata"
              />
            ) : null}
            <button
              type="button"
              className={styles.editCoverBtnOverlay}
              onClick={() => {
                savedCoverRef.current = { blob: coverBlob, url: coverPreviewUrl };
                setStep(3);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit cover
            </button>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Caption</label>
            <textarea
              className={styles.textarea}
              placeholder="Write a caption... use #hashtags inline"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={4}
            />
          </div>

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
            <Button variant="ghost" size="md" onClick={() => setStep(1)}>
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

      {/* ── Step 3: Cover Editor ── */}
      {step === 3 && (
        <>
          <div className={styles.coverEditorPreview}>
            {coverPreviewUrl ? (
              <img src={coverPreviewUrl} alt="Cover preview" />
            ) : videoPreviewUrl ? (
              <video src={videoPreviewUrl} muted playsInline preload="metadata" />
            ) : null}
            <button
              type="button"
              className={styles.customCoverBtn}
              onClick={() => coverFileRef.current?.click()}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </button>
            <input
              ref={coverFileRef}
              type="file"
              accept="image/*"
              onChange={handleCustomCover}
              className={styles.hiddenInput}
            />
          </div>

          {frames.length > 0 && duration > 0 && (
            <div className={styles.scrubberWrap}>
              <span className={styles.label}>Drag to select cover frame</span>
              <div
                ref={scrubTrackRef}
                className={styles.scrubberTrack}
                onPointerDown={handleScrubPointerDown}
              >
                <div className={styles.scrubberFilmstrip}>
                  {frames.map((frame) => (
                    <img key={frame.time} src={frame.url} alt="" className={styles.scrubberFrame} />
                  ))}
                </div>
                <div
                  className={styles.scrubberHandle}
                  style={{ left: `${(coverTime / duration) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className={styles.actions}>
            <Button variant="ghost" size="md" onClick={() => {
              const changed = coverPreviewUrl !== savedCoverRef.current.url;
              if (changed) {
                setShowCoverDiscard(true);
              } else {
                setStep(2);
              }
            }}>
              Back
            </Button>
            <Button variant="primary" size="md" onClick={() => setStep(2)}>
              Done
            </Button>
          </div>
        </>
      )}

      {showDiscard && (
        <ConfirmDialog
          title="Discard video?"
          message="You have a video upload in progress. Are you sure you want to go back?"
          confirmLabel="Discard"
          cancelLabel="Keep editing"
          onConfirm={handleDiscard}
          onCancel={() => setShowDiscard(false)}
        />
      )}

      {showCoverDiscard && (
        <ConfirmDialog
          title="Discard cover changes?"
          message="You changed the cover image. Do you want to discard these changes?"
          confirmLabel="Discard"
          cancelLabel="Keep editing"
          onConfirm={() => {
            // Revoke current cover URL
            if (coverPreviewUrlRef.current) {
              URL.revokeObjectURL(coverPreviewUrlRef.current);
            }
            // Restore saved cover — create fresh ObjectURL from blob
            const savedBlob = savedCoverRef.current.blob;
            setCoverBlob(savedBlob);
            if (savedBlob) {
              const freshUrl = URL.createObjectURL(savedBlob);
              setCoverPreviewUrl(freshUrl);
              coverPreviewUrlRef.current = freshUrl;
            } else {
              setCoverPreviewUrl(null);
              coverPreviewUrlRef.current = null;
            }
            setShowCoverDiscard(false);
            setStep(2);
          }}
          onCancel={() => setShowCoverDiscard(false)}
        />
      )}
    </div>
  );
}

/* ───────────── Preview carousel (swipeable 9:16) ───────────── */

function PreviewCarousel({ urls }: { urls: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);

  useEffect(() => {
    const root = scrollRef.current;
    if (urls.length <= 1 || !root) return;

    const observers = imageRefs.current.map((img, index) => {
      if (!img) return null;
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) setCurrentIndex(index);
        },
        { root, threshold: 0.5 },
      );
      observer.observe(img);
      return observer;
    });

    return () => observers.forEach((o) => o?.disconnect());
  }, [urls.length]);

  if (urls.length === 0) return null;

  if (urls.length === 1) {
    return <img src={urls[0]} alt="Preview" className={styles.coverPreview} />;
  }

  return (
    <div className={styles.previewCarouselWrap}>
      <div ref={scrollRef} className={styles.previewCarousel}>
        <div className={styles.previewCarouselTrack}>
          {urls.map((url, i) => (
            <img
              key={i}
              ref={(el) => { imageRefs.current[i] = el; }}
              src={url}
              alt={`Photo ${i + 1}`}
              className={styles.previewCarouselImage}
            />
          ))}
        </div>
      </div>
      <span className={styles.previewCarouselCounter}>
        {currentIndex + 1}/{urls.length}
      </span>
      <div className={styles.previewCarouselDots}>
        {urls.map((_, i) => (
          <div
            key={i}
            className={`${styles.previewCarouselDot} ${i === currentIndex ? styles.previewCarouselDotActive : ""}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ───────────── Post (2-step: Compose → Review) ───────────── */

function PostForm({ onDirtyChange }: { onDirtyChange: (dirty: boolean) => void }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [step, setStep] = useState<1 | 2>(1);
  const [content, setContent] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // Multi-image upload
  const multiUpload = useMultiUpload(10);

  // Image cropping queue
  const [pendingCropFiles, setPendingCropFiles] = useState<File[]>([]);
  const [currentCropSrc, setCurrentCropSrc] = useState<string | null>(null);
  const currentCropSrcRef = useRef<string | null>(null);

  // Step 2 — review
  const [crossPost, setCrossPost] = useState({
    instagram: false,
    shorts: false,
    tiktok: false,
  });
  const [submitting, setSubmitting] = useState(false);

  // Track dirty state for tab-switch confirmation
  useEffect(() => {
    onDirtyChange(content.trim().length > 0 || multiUpload.items.length > 0);
  }, [content, multiUpload.items.length, onDirtyChange]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = multiUpload.items.findIndex((i) => i.id === active.id);
    const newIndex = multiUpload.items.findIndex((i) => i.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) multiUpload.reorder(oldIndex, newIndex);
  };

  const handleAttachPhotos = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((f) =>
      f.type.startsWith("image/"),
    );
    e.target.value = "";

    if (files.length > 0) {
      // Start cropping flow: queue files and show crop modal for first image
      setPendingCropFiles(files);
      const firstFile = files[0];
      const objectUrl = URL.createObjectURL(firstFile);
      currentCropSrcRef.current = objectUrl;
      setCurrentCropSrc(objectUrl);
    }
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    // Convert blob to File and add to upload queue
    const originalFile = pendingCropFiles[0];
    if (originalFile) {
      const croppedFile = new File([croppedBlob], originalFile.name, { type: "image/webp" });
      multiUpload.addFiles([croppedFile]);
    }

    // Clean up current crop source
    if (currentCropSrcRef.current) {
      URL.revokeObjectURL(currentCropSrcRef.current);
      currentCropSrcRef.current = null;
    }

    // Move to next file in queue
    const remaining = pendingCropFiles.slice(1);
    setPendingCropFiles(remaining);

    if (remaining.length > 0) {
      const nextFile = remaining[0];
      const objectUrl = URL.createObjectURL(nextFile);
      currentCropSrcRef.current = objectUrl;
      setCurrentCropSrc(objectUrl);
    } else {
      setCurrentCropSrc(null);
    }
  };

  const handleCropCancel = () => {
    // Clean up current crop source
    if (currentCropSrcRef.current) {
      URL.revokeObjectURL(currentCropSrcRef.current);
      currentCropSrcRef.current = null;
    }

    // Skip current file and move to next
    const remaining = pendingCropFiles.slice(1);
    setPendingCropFiles(remaining);

    if (remaining.length > 0) {
      const nextFile = remaining[0];
      const objectUrl = URL.createObjectURL(nextFile);
      currentCropSrcRef.current = objectUrl;
      setCurrentCropSrc(objectUrl);
    } else {
      setCurrentCropSrc(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const images = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/"),
    );

    if (images.length > 0) {
      // Start cropping flow: queue files and show crop modal for first image
      setPendingCropFiles(images);
      const firstFile = images[0];
      const objectUrl = URL.createObjectURL(firstFile);
      currentCropSrcRef.current = objectUrl;
      setCurrentCropSrc(objectUrl);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  // Cleanup crop object URLs on unmount
  useEffect(() => {
    return () => {
      if (currentCropSrcRef.current) {
        URL.revokeObjectURL(currentCropSrcRef.current);
      }
    };
  }, []);

  const canProceed = content.trim().length > 0 || multiUpload.items.length > 0;
  const hasPhotos = multiUpload.items.length > 0;

  const handlePost = async () => {
    if (!user || (!content.trim() && !hasPhotos)) return;
    setSubmitting(true);

    const payload: CreatePostPayload = {
      userId: user.id,
      type: hasPhotos ? "image" : "text",
      content: content.trim() || "",
    };

    if (hasPhotos) {
      const urls = multiUpload.getUploadedUrls();
      payload.imageUrls = urls;
      payload.imageUrl = urls[0] ?? undefined;
      payload.crossPostInstagram = crossPost.instagram;
      payload.crossPostShorts = crossPost.shorts;
      payload.crossPostTiktok = crossPost.tiktok;
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
    <>
      {currentCropSrc && (
        <ImageCropModal
          imageSrc={currentCropSrc}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

      <div
        className={`${styles.card} ${isDraggingOver && step === 1 ? styles.dropActive : ""}`}
        onDrop={step === 1 ? handleDrop : undefined}
        onDragOver={step === 1 ? handleDragOver : undefined}
        onDragLeave={step === 1 ? handleDragLeave : undefined}
      >
      {/* ── Step 1: Compose ── */}
      {step === 1 && (
        <>
          <div className={styles.field}>
            <label className={styles.label}>Your post</label>
            <textarea
              className={`${styles.textarea} ${styles.textareaLarge}`}
              placeholder="Share your thoughts, insights, or experience... use #hashtags inline"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
            />
          </div>

          <div className={styles.attachRow}>
            <button
              type="button"
              className={styles.attachBtn}
              onClick={handleAttachPhotos}
              disabled={multiUpload.items.length >= 10}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              Attach photos ({multiUpload.items.length}/10)
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className={styles.hiddenInput}
            />
          </div>

          {multiUpload.items.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={multiUpload.items.map((i) => i.id)}
                strategy={horizontalListSortingStrategy}
              >
                <div className={styles.imageGrid}>
                  {multiUpload.items.map((item) => (
                    <SortableImage
                      key={item.id}
                      id={item.id}
                      url={item.previewUrl}
                      progress={item.progress}
                      uploading={item.uploading}
                      onRemove={() => multiUpload.removeFile(item.id)}
                    />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay>
                {activeDragId ? (
                  <ImageThumbnail
                    url={multiUpload.items.find((i) => i.id === activeDragId)?.previewUrl ?? ""}
                    isDragOverlay
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          )}

          <div className={styles.actions}>
            <span className={styles.charCount}>{content.length} / 5000</span>
            <Button
              variant="primary"
              size="md"
              onClick={() => setStep(2)}
              disabled={!canProceed}
            >
              Next
            </Button>
          </div>
        </>
      )}

      {/* ── Step 2: Review ── */}
      {step === 2 && (
        <>
          {hasPhotos && <PreviewCarousel urls={multiUpload.items.map((i) => i.previewUrl)} />}

          {content.trim() && (
            <p className={styles.previewText}>{content}</p>
          )}

          {hasPhotos && (
            <>
              <div className={styles.divider} />
              <div className={styles.crossPostSection}>
                <span className={styles.crossPostTitle}>Cross-post to</span>
                <ToggleSwitch
                  label="Instagram"
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
            </>
          )}

          <div className={styles.actions}>
            <Button variant="ghost" size="md" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handlePost}
              disabled={submitting || (!content.trim() && !hasPhotos) || (hasPhotos && !multiUpload.allDone)}
            >
              {submitting ? "Posting..." : "Post"}
            </Button>
          </div>
        </>
      )}
      </div>
    </>
  );
}

/* ───────────── Vacancy ───────────── */

function VacancyForm({ onDirtyChange }: { onDirtyChange: (dirty: boolean) => void }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });

  // Track dirty state for tab-switch confirmation
  useEffect(() => {
    onDirtyChange(form.title.trim().length > 0 || form.description.trim().length > 0);
  }, [form.title, form.description, onDirtyChange]);

  const updateField =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.title) return;
    setSubmitting(true);

    try {
      await apiFetch<{ success: boolean; data: Vacancy }>("/vacancies", {
        method: "POST",
        body: JSON.stringify({
          userId: user.id,
          title: form.title,
          description: form.description,
        }),
      });
      navigate("/profile");
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <form className={styles.card} onSubmit={handleSubmit}>
      <Input
        label="Title"
        placeholder="e.g. Senior Frontend Engineer"
        value={form.title}
        onChange={updateField("title")}
      />

      <div className={styles.field}>
        <label className={styles.label}>Description</label>
        <textarea
          className={`${styles.textarea} ${styles.textareaLarge}`}
          placeholder="Describe the role, requirements, team, compensation..."
          value={form.description}
          onChange={updateField("description")}
          rows={8}
        />
      </div>

      <div className={styles.actions}>
        <span />
        <Button
          variant="primary"
          size="md"
          type="submit"
          disabled={submitting || !form.title}
        >
          {submitting ? "Creating..." : "Create Vacancy"}
        </Button>
      </div>
    </form>
  );
}
