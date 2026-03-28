import { create } from "zustand";
import { persist } from "zustand/middleware";

type SoundName = "click" | "hover" | "success" | "error" | "notify" | "navigate";

function synthesize(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.15,
  detune = 0,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  osc.detune.value = detune;
  gain.gain.value = volume;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

const soundRecipes: Record<SoundName, (ctx: AudioContext) => void> = {
  click(ctx) {
    synthesize(ctx, 800, 0.08, "square", 0.08);
    synthesize(ctx, 1200, 0.05, "sine", 0.06);
  },
  hover(ctx) {
    synthesize(ctx, 600, 0.06, "sine", 0.04);
  },
  success(ctx) {
    synthesize(ctx, 523, 0.12, "sine", 0.1);
    setTimeout(() => synthesize(ctx, 659, 0.12, "sine", 0.1), 80);
    setTimeout(() => synthesize(ctx, 784, 0.15, "sine", 0.1), 160);
  },
  error(ctx) {
    synthesize(ctx, 200, 0.2, "sawtooth", 0.08);
    synthesize(ctx, 180, 0.25, "sawtooth", 0.06, 10);
  },
  notify(ctx) {
    synthesize(ctx, 880, 0.1, "sine", 0.1);
    setTimeout(() => synthesize(ctx, 1100, 0.15, "sine", 0.08), 100);
  },
  navigate(ctx) {
    synthesize(ctx, 440, 0.08, "triangle", 0.08);
    setTimeout(() => synthesize(ctx, 660, 0.1, "triangle", 0.06), 60);
  },
};

let audioCtx: AudioContext | null = null;

interface SoundState {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  playSound: (name: SoundName) => void;
}

export const useSoundStore = create<SoundState>()(
  persist(
    (set, get) => ({
      enabled: false,
      setEnabled: (enabled) => set({ enabled }),
      playSound: (name) => {
        if (!get().enabled) return;
        if (!audioCtx) audioCtx = new AudioContext();
        if (audioCtx.state === "suspended") audioCtx.resume();
        soundRecipes[name](audioCtx);
      },
    }),
    {
      name: "rearden-sound",
      partialize: (s) => ({ enabled: s.enabled }),
    }
  )
);
