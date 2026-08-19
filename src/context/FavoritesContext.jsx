import { createContext, useContext } from "react";
import PropTypes from "prop-types";
import useFavorites from "../hooks/useFavorites";

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const favoritesState = useFavorites();

  return <FavoritesContext.Provider value={favoritesState}>{children}</FavoritesContext.Provider>;
}

export function useFavoritesContext() {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error("useFavoritesContext must be used within a FavoritesProvider.");
  }

  return context;
}

export default FavoritesContext;

FavoritesProvider.propTypes = {
  children: PropTypes.node.isRequired
};
