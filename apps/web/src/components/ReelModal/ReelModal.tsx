import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { ArrowLeft } from "@phosphor-icons/react";
import { Feed } from "@/pages/Feed/Feed";
import styles from "./ReelModal.module.scss";

interface ReelModalProps {
  initialPostId: string;
  userId?: string;
  onClose: () => void;
}

export function ReelModal({ initialPostId, userId, onClose }: ReelModalProps) {
  // Lock body scroll
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, []);

  // Escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return createPortal(
    <motion.div
      className={styles.wrapper}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <button
        className={styles.backBtn}
        onClick={onClose}
        aria-label="Close"
      >
        <ArrowLeft size={28} weight="bold" />
      </button>
      <Feed initialPostId={initialPostId} userId={userId} inModal />
    </motion.div>,
    document.body
  );
}
