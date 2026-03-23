import { motion } from "motion/react";
import type { ReactNode } from "react";
import { useSound } from "@/hooks/useSound";
import styles from "./Button.module.scss";

interface ButtonProps {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  className?: string;
  href?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

export function Button({
  variant = "primary",
  size = "md",
  children,
  className,
  href,
  disabled,
  onClick,
  type = "button",
}: ButtonProps) {
  const { playSound } = useSound();

  const classNames = [
    styles.button,
    styles[variant],
    styles[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const handleClick = () => {
    playSound("click");
    onClick?.();
  };

  const motionProps = {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.95, y: 2 },
    transition: { type: "spring" as const, stiffness: 400, damping: 25 },
  };

  if (href) {
    return (
      <motion.a
        href={href}
        className={classNames}
        onClick={() => playSound("click")}
        {...motionProps}
      >
        {children}
      </motion.a>
    );
  }

  return (
    <motion.button
      className={classNames}
      disabled={disabled}
      onClick={handleClick}
      type={type}
      {...motionProps}
    >
      {children}
    </motion.button>
  );
}
