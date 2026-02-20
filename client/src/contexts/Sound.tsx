import { useUIStore } from "@/stores/uiStore";
import { useGameStore } from "@/stores/gameStore";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLocation } from "react-router-dom";

/**
 * Music Credits
 *
 * All tracks from "Dark Ambient Music and Textures" by DDmyzik (2019)
 * Source: https://archive.org/details/darkambient_201908
 * Available via Internet Archive — free to use
 *
 * Tracks used:
 *   - "Crime"            — Intro / Start screen
 *   - "Documentary Dark" — Gameplay
 *   - "Universal Pain"   — Gameplay
 *   - "Gloomy"           — Death screen
 */
const tracks = {
  intro: "https://archive.org/download/darkambient_201908/Crime.wav",
  gameplay: [
    "https://archive.org/download/darkambient_201908/Documentary%20Dark.wav",
    "https://archive.org/download/darkambient_201908/Universal%20Pain.wav",
  ],
  death: "https://archive.org/download/darkambient_201908/Gloomy.wav",
};

type GamePhase = "intro" | "gameplay" | "death";

interface SoundContextType {
  hasInteracted: boolean;
}

const SoundContext = createContext<SoundContextType>({
  hasInteracted: false,
});

export const SoundProvider = ({ children }: PropsWithChildren) => {
  const musicEnabled = useUIStore((s) => s.musicEnabled);
  const isDead = useGameStore((s) => s.isDead);
  const location = useLocation();

  const [hasInteracted, setHasInteracted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentPhaseRef = useRef<GamePhase | null>(null);
  const gameplayIndexRef = useRef(0);

  // Derive phase directly in render
  const phase: GamePhase =
    location.pathname === "/game" ? (isDead ? "death" : "gameplay") : "intro";

  // Initialize audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.volume = 0.3;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  // Handle first user interaction (browser autoplay policy)
  useEffect(() => {
    if (hasInteracted) return;

    const handler = () => setHasInteracted(true);
    document.addEventListener("click", handler, { once: true });
    return () => document.removeEventListener("click", handler);
  }, [hasInteracted]);

  // Handle gameplay track rotation: when one track ends, play the next
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (currentPhaseRef.current !== "gameplay") return;
      gameplayIndexRef.current =
        (gameplayIndexRef.current + 1) % tracks.gameplay.length;
      audio.src = tracks.gameplay[gameplayIndexRef.current];
      audio.play().catch(() => {});
    };

    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, []);

  // Main effect: handle track switching AND play/pause in one place
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Switch track if phase changed
    if (phase !== currentPhaseRef.current) {
      currentPhaseRef.current = phase;

      switch (phase) {
        case "intro":
          audio.src = tracks.intro;
          audio.loop = true;
          break;
        case "gameplay":
          gameplayIndexRef.current = 0;
          audio.src = tracks.gameplay[0];
          audio.loop = false;
          break;
        case "death":
          audio.src = tracks.death;
          audio.loop = true;
          break;
      }
    }

    // Play or pause based on current state
    if (hasInteracted && musicEnabled) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [phase, musicEnabled, hasInteracted]);

  return (
    <SoundContext.Provider value={{ hasInteracted }}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => useContext(SoundContext);
