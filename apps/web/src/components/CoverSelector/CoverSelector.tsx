import styles from "./CoverSelector.module.scss";

interface Frame {
  time: number;
  url: string;
}

interface CoverSelectorProps {
  frames: Frame[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export function CoverSelector({ frames, selectedIndex, onSelect }: CoverSelectorProps) {
  return (
    <div className={styles.wrapper}>
      <span className={styles.label}>Cover photo</span>
      <div className={styles.strip}>
        {frames.map((frame, i) => (
          <button
            key={frame.time}
            className={`${styles.thumb} ${i === selectedIndex ? styles.selected : ""}`}
            onClick={() => onSelect(i)}
            type="button"
          >
            <img src={frame.url} alt={`Frame at ${frame.time.toFixed(1)}s`} />
          </button>
        ))}
      </div>
    </div>
  );
}
