"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type ThemeName = "space" | "ocean" | "jungle";

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  isDark: boolean;
  toggleDarkMode: () => void;
  isCalmMode: boolean;
  toggleCalmMode: () => void;
  isSoundOn: boolean;
  toggleSound: () => void;
  isBgmOn: boolean;
  toggleBgm: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "space",
  setTheme: () => {},
  isDark: false,
  toggleDarkMode: () => {},
  isCalmMode: false,
  toggleCalmMode: () => {},
  isSoundOn: true,
  toggleSound: () => {},
  isBgmOn: false,
  toggleBgm: () => {},
});

export function ThemeProvider({ children, forcedTheme }: { children: React.ReactNode; forcedTheme?: ThemeName | string }) {
  const [theme, setThemeState] = useState<ThemeName>((forcedTheme as ThemeName) || "space");
  const [isDark, setIsDark] = useState<boolean>(false);
  const [isCalmMode, setIsCalmMode] = useState<boolean>(false);
  const [isSoundOn, setIsSoundOn] = useState<boolean>(true);
  const [isBgmOn, setIsBgmOn] = useState<boolean>(false);

  useEffect(() => {
    if (forcedTheme && (forcedTheme === "space" || forcedTheme === "ocean" || forcedTheme === "jungle")) {
      setThemeState(forcedTheme as ThemeName);
    }
  }, [forcedTheme]);

  useEffect(() => {
    // Read local preferences
    const savedTheme = (localStorage.getItem("sv-active-theme") as ThemeName) || "space";
    const savedDark = localStorage.getItem("sv-dark-mode") === "true";
    const savedCalm = localStorage.getItem("sv-calm-mode") === "true";
    const savedSound = localStorage.getItem("sv-sound-on") !== "false"; // default true
    const savedBgm = localStorage.getItem("sv-bgm-on") === "true"; // default false

    setThemeState(savedTheme);
    setIsDark(savedDark);
    setIsCalmMode(savedCalm);
    setIsSoundOn(savedSound);
    setIsBgmOn(savedBgm);

    // Apply data-theme and dark class on <html>
    const root = document.documentElement;
    root.setAttribute("data-theme", savedTheme);
    if (savedDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    if (savedCalm) {
      root.classList.add("calm-mode");
    } else {
      root.classList.remove("calm-mode");
    }
  }, []);

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
    localStorage.setItem("sv-active-theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const toggleDarkMode = () => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem("sv-dark-mode", String(next));
      if (next) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return next;
    });
  };

  const toggleCalmMode = () => {
    setIsCalmMode((prev) => {
      const next = !prev;
      localStorage.setItem("sv-calm-mode", String(next));
      if (next) {
        document.documentElement.classList.add("calm-mode");
      } else {
        document.documentElement.classList.remove("calm-mode");
      }
      return next;
    });
  };

  const toggleSound = () => {
    setIsSoundOn((prev) => {
      const next = !prev;
      localStorage.setItem("sv-sound-on", String(next));
      return next;
    });
  };

  const toggleBgm = () => {
    setIsBgmOn((prev) => {
      const next = !prev;
      localStorage.setItem("sv-bgm-on", String(next));
      return next;
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        isDark,
        toggleDarkMode,
        isCalmMode,
        toggleCalmMode,
        isSoundOn,
        toggleSound,
        isBgmOn,
        toggleBgm,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

