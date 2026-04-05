import { useState, useCallback } from "react";
import { motion } from "motion/react";
import Cropper from "react-easy-crop";
import { getCroppedBlob, type Area } from "@/utils/cropImage";
import { Button } from "@/components/Button/Button";
import styles from "./ImageCropModal.module.scss";

interface ImageCropModalProps {
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

export function ImageCropModal({ imageSrc, onCropComplete, onCancel }: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropCompleteCallback = useCallback(
    (_croppedArea: Area, croppedPixels: Area) => {
      setCroppedAreaPixels(croppedPixels);
    },
    []
  );

  const handleDone = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);

    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
      onCropComplete(blob);
    } catch (error) {
      console.error("Crop failed:", error);
      setProcessing(false);
    }
  };

  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className={styles.container}>
        <div className={styles.cropArea}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={4 / 5}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropCompleteCallback}
            objectFit="contain"
            showGrid={false}
            cropShape="rect"
            style={{
              containerStyle: {
                backgroundColor: "transparent",
              },
            }}
          />
        </div>

        <div className={styles.controls}>
          <div className={styles.zoomControl}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className={styles.zoomSlider}
            />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
              <line x1="8" y1="11" x2="14" y2="11" />
              <line x1="11" y1="8" x2="11" y2="14" />
            </svg>
          </div>

          <div className={styles.actions}>
            <Button variant="ghost" size="md" onClick={onCancel} disabled={processing}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleDone} disabled={!croppedAreaPixels || processing}>
              {processing ? "Processing..." : "Done"}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
