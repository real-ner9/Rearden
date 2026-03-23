import styles from "./Select.module.scss";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  label?: string;
  size?: "md" | "sm";
  className?: string;
}

export function Select({
  value,
  onChange,
  options,
  label,
  size = "md",
  className,
}: SelectProps) {
  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(" ")}>
      {label && <label className={styles.label}>{label}</label>}
      <select
        className={`${styles.select} ${size === "sm" ? styles.sm : ""}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
