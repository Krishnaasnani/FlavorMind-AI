import { useCallback, useEffect, useState } from "react";
import { STORAGE_KEYS, THEMES } from "../constants";

function readTheme() {
  const storedTheme = window.localStorage.getItem(STORAGE_KEYS.THEME);
  return storedTheme === THEMES.DARK ? THEMES.DARK : THEMES.LIGHT;
}

/** Synchronises the user's colour theme with document.body and localStorage. */
export default function useTheme() {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    document.body.classList.remove(THEMES.LIGHT, THEMES.DARK);
    document.body.classList.add(theme);
    window.localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => currentTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK);
  }, []);

  return { theme, toggleTheme };
}
