import { useRef, useState } from "react";
import { VideoPlayer } from "@/components/VideoPlayer/VideoPlayer";
import styles from "./MediaUpload.module.scss";

interface MediaUploadProps {
  type: "image" | "video";
  onUpload: (file: File) => void;
  uploading?: boolean;
  progress?: number;
  previewUrl?: string;
}

export function MediaUpload({
  type,
  onUpload,
  uploading,
  progress = 0,
  previewUrl,
}: MediaUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = type === "video" ? "video/*" : "image/*";
  const hint = type === "video" ? "Video files (MP4, WebM)" : "Image files (JPG, PNG, WebP)";

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith(`${type}/`)) {
      onUpload(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  if (previewUrl) {
    return (
      <div className={styles.preview}>
        {type === "video" ? (
          <VideoPlayer src={previewUrl} />
        ) : (
          <img src={previewUrl} alt="Preview" className={styles.imagePreview} />
        )}
        <button className={styles.reupload} onClick={handleClick}>
          Re-upload
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className={styles.hiddenInput}
        />
      </div>
    );
  }

  return (
    <div
      className={`${styles.dropzone} ${isDragging ? styles.dragging : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className={styles.hiddenInput}
      />

      {uploading ? (
        <div className={styles.uploading}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className={styles.progressText}>{Math.round(progress)}%</p>
        </div>
      ) : (
        <>
          <svg
            className={styles.icon}
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p className={styles.text}>Drag & drop or click to upload</p>
          <p className={styles.hint}>{hint}</p>
        </>
      )}
    </div>
  );
}
