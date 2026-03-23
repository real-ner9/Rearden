import styles from "./SkillTag.module.scss";

interface SkillTagProps {
  skill: string;
  variant?: "default" | "match";
  size?: "sm" | "md";
}

export function SkillTag({ skill, variant = "default", size = "md" }: SkillTagProps) {
  return (
    <span className={`${styles.tag} ${styles[variant]} ${styles[size]}`}>
      {skill}
    </span>
  );
}
