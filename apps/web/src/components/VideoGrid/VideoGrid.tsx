import { useState } from "react";
import { VerticalVideo } from "@/components/VerticalVideo/VerticalVideo";
import styles from "./VideoGrid.module.scss";

interface VideoGridProps {
  videoUrl: string | null;
  thumbnailUrl: string | null;
}

export function VideoGrid({ videoUrl, thumbnailUrl }: VideoGridProps) {
  const [expanded, setExpanded] = useState(false);

  if (!videoUrl) {
    return (
      <div className={styles.empty}>
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <p>No video uploaded yet</p>
      </div>
    );
  }

  if (expanded) {
    return (
      <div className={styles.expandedView}>
        <VerticalVideo
          src={videoUrl}
          poster={thumbnailUrl ?? undefined}
        />
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      <button className={styles.thumbnail} onClick={() => setExpanded(true)}>
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt="Video thumbnail" className={styles.thumbImg} />
        ) : (
          <div className={styles.thumbPlaceholder} />
        )}
        <div className={styles.playOverlay}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </button>
    </div>
  );
}
