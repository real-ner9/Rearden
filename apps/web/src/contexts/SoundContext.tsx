import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type SoundName = "click" | "hover" | "success" | "error" | "notify" | "navigate";

interface SoundContextValue {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  playSound: (name: SoundName) => void;
}

const SoundContext = createContext<SoundContextValue | null>(null);

const STORAGE_KEY = "rearden-sound";

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

export function SoundProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "true";
  });
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  }, [enabled]);

  const playSound = useCallback(
    (name: SoundName) => {
      if (!enabled) return;
      if (!ctxRef.current) {
        ctxRef.current = new AudioContext();
      }
      const ctx = ctxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      soundRecipes[name](ctx);
    },
    [enabled],
  );

  return (
    <SoundContext.Provider value={{ enabled, setEnabled, playSound }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error("useSound must be used within SoundProvider");
  return ctx;
}
