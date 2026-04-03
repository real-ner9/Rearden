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
      // 9:16 thumbnails optimized for vertical video (Reels)
      canvas.width = 180;
      canvas.height = 320;
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

      // Fit video into 16:9 canvas (letterbox/pillarbox)
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const cw = canvas.width;
      const ch = canvas.height;

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, cw, ch);

      const scale = Math.min(cw / vw, ch / vh);
      const dw = vw * scale;
      const dh = vh * scale;
      const dx = (cw - dw) / 2;
      const dy = (ch - dh) / 2;

      ctx.drawImage(video, 0, 0, vw, vh, dx, dy, dw, dh);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("toBlob failed"));
            return;
          }
          const url = URL.createObjectURL(blob);
          resolve({ time, blob, url });
        },
        "image/jpeg",
        0.7
      );
    };

    video.addEventListener("seeked", onSeeked);
    video.currentTime = time;
  });
}
