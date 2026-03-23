import { useState, useEffect } from "react";
import styles from "./SearchBar.module.scss";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  loading?: boolean;
}

const PLACEHOLDERS = [
  "Search for React developers...",
  "Find senior engineers in NYC...",
  "Looking for ML specialists...",
  "Discover full-stack talent...",
];

export function SearchBar({ value, onChange, onSubmit, loading }: SearchBarProps) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onSubmit) {
      onSubmit();
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.searchBar}>
        <div className={styles.iconWrapper}>
          {loading ? (
            <svg className={styles.spinner} width="20" height="20" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.25" />
              <path
                fill="currentColor"
                d="M12 2a10 10 0 0 1 10 10h-3a7 7 0 0 0-7-7V2z"
                opacity="0.75"
              />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          )}
        </div>
        <input
          type="text"
          className={styles.input}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder=""
        />
        {!value && (
          <div className={styles.placeholder} key={placeholderIndex}>
            {PLACEHOLDERS[placeholderIndex]}
          </div>
        )}
      </div>
    </div>
  );
}
