"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useEffect,
  useState,
  useTransition,
  type CSSProperties
} from "react";

import {
  buildSidebarThemeVars,
  type SidebarThemeId,
  defaultSidebarTheme,
  internalSidebarThemes,
  isSidebarTheme,
  parseSidebarTheme,
  sidebarThemeStorageKey
} from "../lib/ui/sidebar-theme";

type SidebarThemeContextValue = {
  setTheme: (theme: SidebarThemeId) => void;
  theme: SidebarThemeId;
  themes: readonly SidebarThemeId[];
};

const SidebarThemeContext = createContext<SidebarThemeContextValue | null>(null);

function readPersistedTheme() {
  if (typeof window === "undefined") {
    return defaultSidebarTheme;
  }

      return parseSidebarTheme(window.localStorage.getItem(sidebarThemeStorageKey));
}

export function SidebarThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<SidebarThemeId>(readPersistedTheme);
  const [, startTransition] = useTransition();
  const [isBrowserReady, setIsBrowserReady] = useState(false);

  const setTheme = useCallback((nextTheme: SidebarThemeId) => {
    if (!isBrowserReady) {
      setThemeState(nextTheme);
      return;
    }

    startTransition(() => {
      setThemeState(nextTheme);
    });

    window.localStorage.setItem(sidebarThemeStorageKey, nextTheme);
  }, [isBrowserReady]);

  const contextValue = useMemo(
    () => ({ setTheme, theme, themes: internalSidebarThemes }),
    [setTheme, theme]
  );

  const themeStyle = useMemo<CSSProperties>(() => buildSidebarThemeVars(theme), [theme]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setIsBrowserReady(true);
    setThemeState((current) => parseSidebarTheme(window.localStorage.getItem(sidebarThemeStorageKey)));
  }, []);

  useEffect(() => {
    if (!isBrowserReady || typeof window === "undefined") {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== sidebarThemeStorageKey) {
        return;
      }
      const nextTheme = parseSidebarTheme(event.newValue);
      setThemeState(nextTheme);
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [isBrowserReady]);

  if (typeof window !== "undefined") {
    return (
      <SidebarThemeContext.Provider value={contextValue}>
        <div
          className="min-h-dvh bg-[color:var(--app-surface)]"
          style={themeStyle}
          data-sidebar-theme={theme}
        >
          {children}
        </div>
      </SidebarThemeContext.Provider>
    );
  }

  return (
    <SidebarThemeContext.Provider value={contextValue}>
      <div style={themeStyle} data-sidebar-theme={theme}>
        {children}
      </div>
    </SidebarThemeContext.Provider>
  );
}

export function useSidebarThemeContext() {
  const value = useContext(SidebarThemeContext);

  if (!value) {
    throw new Error("useSidebarThemeContext used outside SidebarThemeProvider");
  }

  return value;
}
