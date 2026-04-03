import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "@/utils/cropImage";
import styles from "./ImageCropper.module.scss";

interface ImageCropperProps {
  imageUrl: string;
  onCropChange: (area: Area) => void;
}

export function ImageCropper({ imageUrl, onCropChange }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const handleCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      onCropChange(croppedAreaPixels);
    },
    [onCropChange]
  );

  return (
    <div className={styles.container}>
      <Cropper
        image={imageUrl}
        crop={crop}
        zoom={zoom}
        aspect={1}
        onCropChange={setCrop}
        onZoomChange={setZoom}
        onCropComplete={handleCropComplete}
        showGrid={false}
        style={{
          containerStyle: {
            width: "100%",
            height: "100%",
            background: "#000",
          },
        }}
      />
    </div>
  );
}
