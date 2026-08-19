import { useCallback, useEffect, useState } from "react";
import { STORAGE_KEYS } from "../constants";

function readFavorites() {
  try {
    const storedFavorites = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.FAVORITES) || "[]");
    return Array.isArray(storedFavorites) ? storedFavorites : [];
  } catch {
    return [];
  }
}

function recipeId(recipeOrId) {
  return typeof recipeOrId === "object" ? recipeOrId?.id || recipeOrId?.idMeal : recipeOrId;
}

/** Persistent recipe-favourites state backed by localStorage. */
export default function useFavorites() {
  const [favorites, setFavorites] = useState(readFavorites);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = useCallback((recipe) => {
    const id = recipeId(recipe);
    if (!id) return;

    setFavorites((currentFavorites) => {
      if (currentFavorites.some((favorite) => recipeId(favorite) === id)) return currentFavorites;
      return [...currentFavorites, recipe];
    });
  }, []);

  const removeFavorite = useCallback((recipeOrId) => {
    const id = recipeId(recipeOrId);
    setFavorites((currentFavorites) => currentFavorites.filter((favorite) => recipeId(favorite) !== id));
  }, []);

  const isFavorite = useCallback((recipeOrId) => {
    const id = recipeId(recipeOrId);
    return favorites.some((favorite) => recipeId(favorite) === id);
  }, [favorites]);

  return { favorites, addFavorite, removeFavorite, isFavorite };
}
