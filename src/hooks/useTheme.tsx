import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeId = "crimson" | "midnight" | "emerald" | "royal" | "sunset";

export const THEMES: {
  id: ThemeId;
  label: string;
  hint: string;
  dark: boolean;
  swatch: string[];
}[] = [
  {
    id: "crimson",
    label: "Nexa Crimson",
    hint: "Signature light theme",
    dark: false,
    swatch: ["oklch(0.56 0.208 20.5)", "oklch(0.22 0.045 262)", "oklch(0.982 0.004 250)"],
  },
  {
    id: "midnight",
    label: "Midnight Vault",
    hint: "Deep dark banking",
    dark: true,
    swatch: ["oklch(0.62 0.2 22)", "oklch(0.2 0.04 263)", "oklch(0.15 0.032 264)"],
  },
  {
    id: "emerald",
    label: "Emerald Growth",
    hint: "Fresh wealth green",
    dark: false,
    swatch: ["oklch(0.55 0.14 162)", "oklch(0.24 0.05 170)", "oklch(0.985 0.008 165)"],
  },
  {
    id: "royal",
    label: "Royal Indigo",
    hint: "Premium private bank",
    dark: true,
    swatch: ["oklch(0.62 0.19 275)", "oklch(0.22 0.06 280)", "oklch(0.16 0.04 280)"],
  },
  {
    id: "sunset",
    label: "Sunset Amber",
    hint: "Warm retail banking",
    dark: false,
    swatch: ["oklch(0.68 0.16 55)", "oklch(0.28 0.05 45)", "oklch(0.985 0.01 80)"],
  },
];

const STORAGE_KEY = "nexa-theme";

type Ctx = { theme: ThemeId; setTheme: (t: ThemeId) => void };
const ThemeContext = createContext<Ctx>({ theme: "crimson", setTheme: () => {} });

function applyTheme(id: ThemeId) {
  const meta = THEMES.find((t) => t.id === id) ?? THEMES[0]!;
  const root = document.documentElement;
  THEMES.forEach((t) => root.classList.remove(`theme-${t.id}`));
  root.classList.add(`theme-${meta.id}`);
  root.classList.toggle("dark", meta.dark);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("crimson");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    const next = THEMES.some((t) => t.id === stored) ? (stored as ThemeId) : "crimson";
    setThemeState(next);
    applyTheme(next);
  }, []);

  const setTheme = (t: ThemeId) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
    applyTheme(t);
  };

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
