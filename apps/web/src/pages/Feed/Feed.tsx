import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import type { Candidate } from "@rearden/types";

import { useApi } from "@/hooks/useApi";
import { useChat } from "@/contexts/ChatContext";
import styles from "./Feed.module.scss";

export function Feed() {
  const navigate = useNavigate();
  const { startConversation } = useChat();
  const { data: candidates } = useApi<Candidate[]>("/candidates");
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Only candidates with videos
  const videoCandidates = candidates?.filter((c) => c.videoUrl) ?? [];
  const current = videoCandidates[currentIndex];

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= videoCandidates.length) return;
      // Pause previous video
      videoRefs.current[currentIndex]?.pause();
      setCurrentIndex(index);
    },
    [currentIndex, videoCandidates.length]
  );

  const goNext = useCallback(() => goTo(currentIndex + 1), [goTo, currentIndex]);
  const goPrev = useCallback(() => goTo(currentIndex - 1), [goTo, currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "j") goNext();
      if (e.key === "ArrowUp" || e.key === "k") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev]);

  // Wheel/scroll navigation with debounce
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    let locked = false;

    const handler = (e: WheelEvent) => {
      e.preventDefault();
      if (locked) return;
      locked = true;
      timeout = setTimeout(() => (locked = false), 600);

      if (e.deltaY > 0) goNext();
      else if (e.deltaY < 0) goPrev();
    };

    const el = containerRef.current;
    el?.addEventListener("wheel", handler, { passive: false });
    return () => {
      el?.removeEventListener("wheel", handler);
      clearTimeout(timeout);
    };
  }, [goNext, goPrev]);

  // Touch swipe
  useEffect(() => {
    let startY = 0;
    const el = containerRef.current;

    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const diff = startY - e.changedTouches[0].clientY;
      if (Math.abs(diff) > 50) {
        if (diff > 0) goNext();
        else goPrev();
      }
    };

    el?.addEventListener("touchstart", onTouchStart, { passive: true });
    el?.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el?.removeEventListener("touchstart", onTouchStart);
      el?.removeEventListener("touchend", onTouchEnd);
    };
  }, [goNext, goPrev]);

  // Autoplay current video
  useEffect(() => {
    const vid = videoRefs.current[currentIndex];
    if (vid) {
      vid.currentTime = 0;
      vid.play().catch(() => {});
    }
  }, [currentIndex]);

  if (!candidates) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (videoCandidates.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No video reels yet</p>
      </div>
    );
  }

  return (
    <div className={styles.feed} ref={containerRef}>
      <AnimatePresence mode="wait">
        {current && (
          <motion.div
            key={current.id}
            className={styles.reel}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Video */}
            <div className={styles.videoWrapper}>
              <video
                ref={(el) => { videoRefs.current[currentIndex] = el; }}
                className={styles.video}
                src={current.videoUrl!}
                poster={current.thumbnailUrl ?? undefined}
                loop
                muted
                playsInline
                onClick={(e) => {
                  const v = e.currentTarget;
                  v.paused ? v.play() : v.pause();
                }}
              />

              {/* Gradient overlay */}
              <div className={styles.gradient} />

              {/* Candidate info overlay */}
              <div className={styles.overlay}>
                <button
                  className={styles.candidateName}
                  onClick={() => navigate(`/candidate/${current.id}`)}
                >
                  {current.name}
                </button>
                <p className={styles.candidateTitle}>{current.title}</p>
                <p className={styles.candidateLocation}>
                  {current.location} &middot; {current.experience}yr exp
                </p>
                <div className={styles.candidateSkills}>
                  {current.skills.slice(0, 4).map((s) => (
                    <span key={s} className={styles.skillChip}>#{s.toLowerCase().replace(/\s+/g, "")}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className={styles.actions}>
              <button
                className={styles.actionBtn}
                onClick={() => navigate(`/candidate/${current.id}`)}
                title="View profile"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className={styles.actionLabel}>Profile</span>
              </button>

              <button
                className={styles.actionBtn}
                onClick={() => startConversation(current.id, current.name)}
                title="Message"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                <span className={styles.actionLabel}>Chat</span>
              </button>

              {current.resumeText && (
                <button
                  className={styles.actionBtn}
                  onClick={() => navigate(`/candidate/${current.id}/resume`)}
                  title="Resume"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span className={styles.actionLabel}>CV</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation arrows (desktop) */}
      <div className={styles.navArrows}>
        <button
          className={styles.arrowBtn}
          onClick={goPrev}
          disabled={currentIndex === 0}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
        <button
          className={styles.arrowBtn}
          onClick={goNext}
          disabled={currentIndex >= videoCandidates.length - 1}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Counter */}
      <div className={styles.counter}>
        {currentIndex + 1} / {videoCandidates.length}
      </div>
    </div>
  );
}
