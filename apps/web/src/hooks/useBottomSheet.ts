import { useDragControls, useMotionValue, useTransform, animate } from "motion/react";

interface UseBottomSheetOptions {
  onClose: () => void;
  /** Pixel offset threshold to dismiss (default: 150) */
  dismissOffset?: number;
  /** Velocity threshold to dismiss (default: 500) */
  dismissVelocity?: number;
  /** Max range for backdrop opacity transform (default: 300) */
  backdropRange?: number;
}

export function useBottomSheet({
  onClose,
  dismissOffset = 150,
  dismissVelocity = 500,
  backdropRange = 300,
}: UseBottomSheetOptions) {
  const dragControls = useDragControls();
  const sheetY = useMotionValue(0);
  const backdropOpacity = useTransform(sheetY, [0, backdropRange], [1, 0]);

  const onDragEnd = (_: unknown, info: { offset: { y: number }; velocity: { y: number } }) => {
    if (info.offset.y > dismissOffset || info.velocity.y > dismissVelocity) {
      onClose();
    } else {
      animate(sheetY, 0, { type: "tween", duration: 0.15 });
    }
  };

  const startDrag = (e: React.PointerEvent) => {
    dragControls.start(e);
  };

  const sheetDragProps = {
    drag: "y" as const,
    dragControls,
    dragListener: false,
    dragConstraints: { top: 0 },
    dragElastic: { top: 0, bottom: 0.3 },
    style: { y: sheetY },
    onDragEnd,
  };

  return { sheetDragProps, backdropOpacity, startDrag };
}
