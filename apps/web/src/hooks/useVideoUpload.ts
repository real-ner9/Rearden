import { useState } from "react";

export function useVideoUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const upload = async (file: File): Promise<string> => {
    setUploading(true);
    setProgress(0);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setProgress(percentComplete);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          setUploading(false);
          resolve(response.data.url);
        } else {
          setUploading(false);
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        setUploading(false);
        reject(new Error("Upload failed"));
      });

      const formData = new FormData();
      formData.append("file", file);

      xhr.open("POST", "/api/upload");
      xhr.send(formData);
    });
  };

  return { upload, uploading, progress, previewUrl };
}
