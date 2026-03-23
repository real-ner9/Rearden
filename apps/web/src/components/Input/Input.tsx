import type { ReactNode } from "react";
import styles from "./Input.module.scss";

interface InputProps {
  label?: string;
  error?: string;
  icon?: ReactNode;
  className?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  name?: string;
  id?: string;
}

export function Input({
  label,
  error,
  icon,
  className,
  placeholder,
  value,
  onChange,
  type = "text",
  name,
  id,
}: InputProps) {
  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(" ")}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.inputWrapper}>
        {icon && <div className={styles.icon}>{icon}</div>}
        <input
          className={`${styles.input} ${icon ? styles.hasIcon : ""} ${error ? styles.error : ""}`}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          name={name}
          id={id}
        />
      </div>
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
}
