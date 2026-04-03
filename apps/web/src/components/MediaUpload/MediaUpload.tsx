import { useRef, useState } from "react";
import { VideoPlayer } from "@/components/VideoPlayer/VideoPlayer";
import styles from "./MediaUpload.module.scss";

interface MediaUploadProps {
  onUpload: (files: File[]) => void;
  uploading?: boolean;
  progress?: number;
  previewUrl?: string;
  previewType?: "image" | "video";
  multiple?: boolean;
  accept?: string;
}

export function MediaUpload({
  onUpload,
  uploading,
  progress = 0,
  previewUrl,
  previewType,
  multiple,
  accept = "video/*,image/*",
}: MediaUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

    const acceptTypes = accept.split(",").map((a) => a.trim().replace("/*", "/"));
    const valid = Array.from(e.dataTransfer.files).filter((f) =>
      acceptTypes.some((t) => f.type.startsWith(t)),
    );
    if (valid.length > 0) onUpload(multiple ? valid : [valid[0]]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) onUpload(files);
    e.target.value = "";
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  if (previewUrl) {
    return (
      <div className={styles.preview}>
        {previewType === "video" ? (
          <div className={styles.videoContainer}>
            <VideoPlayer src={previewUrl} compact />
          </div>
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
          multiple={multiple}
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
        multiple={multiple}
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
          <p className={styles.hint}>
            {accept === "video/*"
              ? "Upload a video"
              : accept === "image/*"
                ? "Upload photos"
                : "1 video or up to 10 photos"}
          </p>
        </>
      )}
    </div>
  );
}
