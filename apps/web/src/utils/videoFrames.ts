export interface FrameData {
  time: number;
  blob: Blob;
  url: string;
}

export async function extractFrames(
  videoUrl: string,
  count: number
): Promise<FrameData[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.preload = "auto";
    video.src = videoUrl;

    video.addEventListener("error", () =>
      reject(new Error("Failed to load video for frame extraction"))
    );

    video.addEventListener("loadedmetadata", async () => {
      const duration = video.duration;
      if (!duration || !isFinite(duration)) {
        reject(new Error("Invalid video duration"));
        return;
      }

      const canvas = document.createElement("canvas");
      // Use native aspect ratio, capped at 360px on longest side
      const maxDim = 360;
      const vw = video.videoWidth || 180;
      const vh = video.videoHeight || 320;
      const frameScale = Math.min(1, maxDim / Math.max(vw, vh));
      canvas.width = Math.round(vw * frameScale);
      canvas.height = Math.round(vh * frameScale);
      const ctx = canvas.getContext("2d")!;

      const frames: FrameData[] = [];
      const step = duration / (count + 1);

      for (let i = 1; i <= count; i++) {
        const time = step * i;
        try {
          const frame = await seekAndCapture(video, canvas, ctx, time);
          frames.push(frame);
        } catch {
          // skip failed frame
        }
      }

      resolve(frames);
    });
  });
}

function seekAndCapture(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  time: number
): Promise<FrameData> {
  return new Promise((resolve, reject) => {
    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);

      const cw = canvas.width;
      const ch = canvas.height;
      ctx.drawImage(video, 0, 0, cw, ch);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("toBlob failed"));
            return;
          }
          const url = URL.createObjectURL(blob);
          resolve({ time, blob, url });
        },
        "image/webp",
        0.85
      );
    };

    video.addEventListener("seeked", onSeeked);
    video.currentTime = time;
  });
}
