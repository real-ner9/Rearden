import { useState, useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";

export interface UploadItem {
  id: string;
  file: File;
  previewUrl: string;
  uploadedUrl: string | null;
  uploading: boolean;
  progress: number;
}

export function useMultiUpload(maxFiles = 10) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const itemsRef = useRef<UploadItem[]>([]);

  // Keep ref in sync with state
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const uploadFile = useCallback((item: UploadItem) => {
    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id ? { ...it, progress: percentComplete } : it
            )
          );
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          const uploadedUrl = response.data.url;
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? { ...it, uploadedUrl, uploading: false, progress: 100 }
                : it
            )
          );
          resolve(uploadedUrl);
        } else {
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id ? { ...it, uploading: false } : it
            )
          );
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id ? { ...it, uploading: false } : it
          )
        );
        reject(new Error("Upload failed"));
      });

      const formData = new FormData();
      formData.append("file", item.file);

      xhr.open("POST", "/api/upload");

      const token = useAuthStore.getState().token;
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }

      xhr.send(formData);
    });
  }, []);

  const addFiles = useCallback(
    (files: File[]) => {
      const currentCount = itemsRef.current.length;
      const availableSlots = maxFiles - currentCount;
      const filesToAdd = files.slice(0, availableSlots);

      if (filesToAdd.length === 0) return;

      const newItems: UploadItem[] = filesToAdd.map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        uploadedUrl: null,
        uploading: true,
        progress: 0,
      }));

      setItems((prev) => [...prev, ...newItems]);

      // Start uploading all new items in parallel
      newItems.forEach((item) => {
        uploadFile(item).catch((error) => {
          console.error(`Failed to upload ${item.file.name}:`, error);
        });
      });
    },
    [maxFiles, uploadFile]
  );

  const removeFile = useCallback((id: string) => {
    setItems((prev) => {
      const item = prev.find((it) => it.id === id);
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((it) => it.id !== id);
    });
  }, []);

  const reorder = useCallback((from: number, to: number) => {
    setItems((prev) => {
      const newItems = [...prev];
      const [removed] = newItems.splice(from, 1);
      newItems.splice(to, 0, removed);
      return newItems;
    });
  }, []);

  const getUploadedUrls = useCallback(() => {
    return items
      .map((item) => item.uploadedUrl)
      .filter((url): url is string => url !== null);
  }, [items]);

  const reset = useCallback(() => {
    // Revoke all object URLs
    itemsRef.current.forEach((item) => {
      URL.revokeObjectURL(item.previewUrl);
    });
    setItems([]);
  }, []);

  const allDone = items.length > 0 && items.every((item) => item.uploadedUrl !== null);
  const anyUploading = items.some((item) => item.uploading);

  // Cleanup: revoke all Object URLs on unmount
  useEffect(() => {
    return () => {
      itemsRef.current.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, []);

  return {
    items,
    addFiles,
    removeFile,
    reorder,
    getUploadedUrls,
    allDone,
    anyUploading,
    reset,
  };
}
