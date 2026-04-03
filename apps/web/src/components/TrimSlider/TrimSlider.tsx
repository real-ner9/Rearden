import { useRef, useCallback } from "react";
import styles from "./TrimSlider.module.scss";

interface Frame {
  time: number;
  url: string;
}

interface TrimSliderProps {
  frames: Frame[];
  duration: number;
  startTime: number;
  endTime: number;
  onRangeChange: (start: number, end: number) => void;
}

const MIN_RANGE = 1; // minimum 1 second

export function TrimSlider({
  frames,
  duration,
  startTime,
  endTime,
  onRangeChange,
}: TrimSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const getPosition = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return 0;
      const rect = trackRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return ratio * duration;
    },
    [duration]
  );

  const handlePointerDown = useCallback(
    (handle: "start" | "end") => (e: React.PointerEvent) => {
      e.preventDefault();
      const el = e.currentTarget as HTMLElement;
      el.setPointerCapture(e.pointerId);

      const onMove = (ev: PointerEvent) => {
        const time = getPosition(ev.clientX);
        if (handle === "start") {
          const clamped = Math.min(time, endTime - MIN_RANGE);
          onRangeChange(Math.max(0, clamped), endTime);
        } else {
          const clamped = Math.max(time, startTime + MIN_RANGE);
          onRangeChange(startTime, Math.min(duration, clamped));
        }
      };

      const onUp = () => {
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerup", onUp);
      };

      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerup", onUp);
    },
    [duration, startTime, endTime, getPosition, onRangeChange]
  );

  const startPct = (startTime / duration) * 100;
  const endPct = (endTime / duration) * 100;

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className={styles.wrapper}>
      <span className={styles.label}>Trim</span>
      <div className={styles.track} ref={trackRef}>
        {/* Filmstrip background */}
        <div className={styles.filmstrip}>
          {frames.map((frame) => (
            <img key={frame.time} src={frame.url} alt="" className={styles.filmFrame} />
          ))}
        </div>

        {/* Dimmed regions */}
        <div className={styles.dimLeft} style={{ width: `${startPct}%` }} />
        <div className={styles.dimRight} style={{ width: `${100 - endPct}%` }} />

        {/* Selected range highlight */}
        <div
          className={styles.range}
          style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }}
        />

        {/* Handles */}
        <div
          className={styles.handle}
          style={{ left: `${startPct}%` }}
          onPointerDown={handlePointerDown("start")}
        />
        <div
          className={styles.handle}
          style={{ left: `${endPct}%` }}
          onPointerDown={handlePointerDown("end")}
        />
      </div>
      <div className={styles.times}>
        <span>{formatTime(startTime)}</span>
        <span>{formatTime(endTime)}</span>
      </div>
    </div>
  );
}
