import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { countries, type Country } from "@/data/countries";
import styles from "./PhoneInput.module.scss";

interface PhoneInputProps {
  value: string;
  onChange: (fullPhone: string) => void;
  onSubmit?: () => void;
  autoFocus?: boolean;
  onValidChange?: (valid: boolean) => void;
}

const DEFAULT_COUNTRY = countries.find((c) => c.code === "US")!;

/** Find exact matching country for a dial code */
function matchCountry(digits: string): Country | null {
  if (!digits) return null;
  const withPlus = "+" + digits;
  let best: Country | null = null;
  for (const c of countries) {
    if (c.dial === withPlus && (!best || c.dial.length > best.dial.length)) {
      best = c;
    }
  }
  // Fallback: partial prefix match (user is still typing)
  if (!best) {
    for (const c of countries) {
      if (c.dial.startsWith(withPlus) && (!best || c.dial.length < best.dial.length)) {
        best = c;
      }
    }
  }
  return best;
}

/** Exact match — dial code matches a country exactly */
function isExactDialCode(digits: string): boolean {
  if (!digits) return false;
  const withPlus = "+" + digits;
  return countries.some((c) => c.dial === withPlus);
}

/** No match at all — not even a prefix of any known code */
function hasNoMatch(digits: string): boolean {
  if (!digits) return false;
  const withPlus = "+" + digits;
  return !countries.some((c) => c.dial === withPlus || c.dial.startsWith(withPlus));
}

export function PhoneInput({
  value,
  onChange,
  onSubmit,
  autoFocus,
  onValidChange,
}: PhoneInputProps) {
  const [country, setCountry] = useState<Country | null>(DEFAULT_COUNTRY);
  const [dialDigits, setDialDigits] = useState(DEFAULT_COUNTRY.dial.slice(1)); // without "+"
  const [localNumber, setLocalNumber] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const phoneRef = useRef<HTMLInputElement>(null);
  const dialRef = useRef<HTMLInputElement>(null);

  const exactMatch = isExactDialCode(dialDigits);
  const noMatch = hasNoMatch(dialDigits);

  // Sync full phone to parent
  useEffect(() => {
    onChange("+" + dialDigits + localNumber);
  }, [dialDigits, localNumber]); // eslint-disable-line react-hooks/exhaustive-deps

  // Notify parent about validity
  useEffect(() => {
    onValidChange?.(exactMatch);
  }, [exactMatch]); // eslint-disable-line react-hooks/exhaustive-deps

  // When dial digits change, auto-match country
  const handleDialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^\d]/g, "");
    setDialDigits(digits);

    const matched = matchCountry(digits);
    setCountry(matched);
  };

  // When country is selected from modal, update dial digits
  const handleCountrySelect = useCallback((c: Country) => {
    setCountry(c);
    setDialDigits(c.dial.slice(1)); // strip "+"
    setModalOpen(false);
    setTimeout(() => phoneRef.current?.focus(), 50);
  }, []);

  // Apply mask: take raw digits, insert spaces where the mask has them
  const applyMask = useCallback(
    (digits: string): string => {
      const mask = country?.mask;
      if (!mask) return digits;

      let result = "";
      let di = 0; // digit index
      for (let i = 0; i < mask.length && di < digits.length; i++) {
        if (mask[i] === " ") {
          result += " ";
        } else {
          result += digits[di];
          di++;
        }
      }
      return result;
    },
    [country]
  );

  // Max digits allowed by mask
  const maxDigits = country?.mask
    ? country.mask.replace(/ /g, "").length
    : 15;

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^\d]/g, "").slice(0, maxDigits);
    setLocalNumber(digits);
  };

  const formattedNumber = applyMask(localNumber);

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button
          type="button"
          className={`${styles.countrySelector} ${!exactMatch && dialDigits ? styles.countrySelectorInvalid : ""}`}
          onClick={() => {
            if (country && !exactMatch) {
              // Click suggestion to auto-complete dial code
              setDialDigits(country.dial.slice(1));
            } else {
              setModalOpen(true);
            }
          }}
        >
          {noMatch ? (
            <span className={styles.countrySelectorInvalidText}>Invalid Country Code</span>
          ) : country && !exactMatch ? (
            <span className={styles.countrySelectorHint}>
              {country.name} {country.dial}
            </span>
          ) : country ? (
            <span className={styles.countrySelectorValue}>
              {country.name} {country.dial}
            </span>
          ) : (
            <span>Country Code</span>
          )}
          <svg
            className={styles.chevron}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        <div className={styles.phoneRow}>
          <div className={styles.dialCodeWrapper}>
            <span className={styles.plusSign}>+</span>
            <input
              ref={dialRef}
              className={styles.dialInput}
              type="tel"
              inputMode="numeric"
              value={dialDigits}
              onChange={handleDialChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSubmit?.();
              }}
              style={{ width: `${Math.max(dialDigits.length, 1) + 0.5}ch` }}
            />
          </div>
          <input
            ref={phoneRef}
            className={styles.phoneNumber}
            type="tel"
            inputMode="numeric"
            placeholder={country?.mask || "Phone number"}
            value={formattedNumber}
            onChange={handleNumberChange}
            onKeyDown={(e) => e.key === "Enter" && onSubmit?.()}
            autoFocus={autoFocus}
          />
        </div>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <CountryModal
            selected={country?.code ?? null}
            onSelect={handleCountrySelect}
            onClose={() => setModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ---- Country picker modal ----

interface CountryModalProps {
  selected: string | null;
  onSelect: (c: Country) => void;
  onClose: () => void;
}

function CountryModal({ selected, onSelect, onClose }: CountryModalProps) {
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const filtered = useMemo(() => {
    if (!search.trim()) return countries;
    const q = search.toLowerCase();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dial.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        className={styles.modal}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.15 }}
      >
        <div className={styles.modalHeader}>Select Country</div>

        <div className={styles.searchRow}>
          <svg
            className={styles.searchIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={searchRef}
            className={styles.searchInput}
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.list} ref={listRef}>
          {filtered.length === 0 ? (
            <div className={styles.empty}>No countries found</div>
          ) : (
            filtered.map((c) => (
              <button
                key={c.code}
                className={`${styles.countryItem} ${c.code === selected ? styles.countryItemActive : ""}`}
                onClick={() => onSelect(c)}
              >
                <span className={styles.countryName}>{c.name}</span>
                <span className={styles.countryDial}>{c.dial}</span>
              </button>
            ))
          )}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.closeBtn} onClick={onClose}>
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
