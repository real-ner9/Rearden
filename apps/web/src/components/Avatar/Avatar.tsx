import styles from "./Avatar.module.scss";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  className?: string;
}

export function Avatar({
  src,
  name,
  size = "md",
  onClick,
  className,
}: AvatarProps) {
  const getInitials = (name: string | null | undefined): string => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  const sizeClass = styles[size];
  const clickableClass = onClick ? styles.clickable : "";
  const combinedClassName = [
    styles.avatar,
    sizeClass,
    clickableClass,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (src) {
    return (
      <img
        src={src}
        alt={name || "User avatar"}
        className={combinedClassName}
        onClick={onClick}
      />
    );
  }

  return (
    <div className={combinedClassName} onClick={onClick}>
      {getInitials(name)}
    </div>
  );
}
