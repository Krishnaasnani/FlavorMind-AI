import { createContext, useContext } from "react";
import PropTypes from "prop-types";
import useTheme from "../hooks/useTheme";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const themeState = useTheme();

  return <ThemeContext.Provider value={themeState}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useThemeContext must be used within a ThemeProvider.");
  }

  return context;
}

export default ThemeContext;

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired
};
