import { useState, useRef, useEffect, useCallback } from "react";
import { countries } from "@/data/countries";
import styles from "./LocationInput.module.scss";

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function LocationInput({
  value,
  onChange,
  placeholder = "San Francisco, CA",
}: LocationInputProps) {
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const query = value.toLowerCase();
  const filtered = query
    ? countries.filter((c) => c.name.toLowerCase().includes(query))
    : [];
  const showDropdown = open && filtered.length > 0;

  const select = useCallback(
    (name: string) => {
      onChange(name);
      setOpen(false);
      setHighlightIndex(-1);
    },
    [onChange],
  );

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightIndex] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev < filtered.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev > 0 ? prev - 1 : filtered.length - 1,
      );
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      select(filtered[highlightIndex].name);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <input
        className={styles.input}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlightIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />
      {showDropdown && (
        <ul className={styles.dropdown} ref={listRef}>
          {filtered.slice(0, 20).map((country, i) => (
            <li
              key={country.code}
              className={`${styles.option} ${i === highlightIndex ? styles.optionHighlight : ""}`}
              onMouseDown={(e) => {
                e.preventDefault();
                select(country.name);
              }}
              onMouseEnter={() => setHighlightIndex(i)}
            >
              {country.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
