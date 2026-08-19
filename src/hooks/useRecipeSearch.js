import { useEffect, useMemo, useRef, useState } from "react";
import { searchRecipes } from "../services/theMealDB";
import { SEARCH_CONFIG } from "../constants";

/** Debounced TheMealDB recipe search that ignores superseded responses. */
export default function useRecipeSearch(query, filters = {}) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const activeRequestRef = useRef(0);
  const filtersKey = JSON.stringify(filters);
  const stableFilters = useMemo(() => JSON.parse(filtersKey), [filtersKey]);

  useEffect(() => {
    const cleanQuery = query?.trim();
    const hasFilter = Boolean(stableFilters.category || stableFilters.cuisine || stableFilters.ingredient);
    const requestId = activeRequestRef.current + 1;
    activeRequestRef.current = requestId;

    if (!cleanQuery && !hasFilter) {
      setRecipes([]);
      setLoading(false);
      setError("");
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      async function loadResults() {
        setLoading(true);
        setError("");

        const { data, error: requestError, aborted } = await searchRecipes(cleanQuery, stableFilters, { signal: controller.signal });
        if (controller.signal.aborted || aborted || requestId !== activeRequestRef.current) return;

        setLoading(false);
        if (requestError) {
          setRecipes([]);
          setError(requestError);
          return;
        }

        setRecipes(data?.results || []);
      }

      loadResults();
    }, SEARCH_CONFIG.DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [filtersKey, query, stableFilters]);

  return { recipes, loading, error };
}
