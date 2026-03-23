import styles from "./Logo.module.scss";

interface LogoProps {
  size?: "sm" | "md" | "lg";
}

export function Logo({ size = "md" }: LogoProps) {
  return <h1 className={`${styles.logo} ${styles[size]}`}>REARDEN</h1>;
}
