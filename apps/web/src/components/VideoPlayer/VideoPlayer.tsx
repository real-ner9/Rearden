import { useEffect, useRef } from "react";
import Plyr from "plyr";
import "plyr/dist/plyr.css";
import styles from "./VideoPlayer.module.scss";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  compact?: boolean;
}

export function VideoPlayer({ src, poster, compact }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Plyr | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up previous instance
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }

    // Create fresh video element
    const video = document.createElement("video");
    video.playsInline = true;
    video.src = src;
    if (poster) video.poster = poster;

    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(video);

    playerRef.current = new Plyr(video, {
      controls: compact
        ? ["play-large", "play", "progress", "current-time", "mute"]
        : [
            "play-large",
            "play",
            "progress",
            "current-time",
            "mute",
            "volume",
            "fullscreen",
          ],
      tooltips: { controls: false, seek: true },
      keyboard: { focused: true, global: false },
      hideControls: true,
      resetOnEnd: true,
    });

    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [src, poster, compact]);

  return (
    <div
      ref={containerRef}
      className={`${styles.wrapper} ${compact ? styles.compact : ""}`}
    />
  );
}
