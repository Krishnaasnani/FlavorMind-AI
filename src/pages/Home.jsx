import { useCallback, useMemo, useState } from "react";
import Filters from "../components/Filters/Filters";
import RecipeCard from "../components/RecipeCard/RecipeCard";
import SearchBar from "../components/SearchBar/SearchBar";
import SkeletonCard from "../components/SkeletonCard/SkeletonCard";
import { useFavoritesContext } from "../context/FavoritesContext";
import useRecipeSearch from "../hooks/useRecipeSearch";
import { FEATURED_SEARCHES, SEARCH_CONFIG } from "../constants";
import { getRecipeRecommendations } from "../utils/recommendations";
import styles from "./Home.module.css";

function Home() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(SEARCH_CONFIG.INITIAL_FILTERS);
  const [activeBrowse, setActiveBrowse] = useState("");
  const { recipes, loading, error } = useRecipeSearch(query, filters);
  const { favorites } = useFavoritesContext();
  const visibleRecipes = recipes;
  const hasActiveSearch = Boolean(query.trim() || filters.category || filters.cuisine || filters.ingredient || filters.dietary);
  const resultDescriptor = [filters.cuisine, filters.dietary || filters.category, filters.ingredient && `with ${filters.ingredient}`].filter(Boolean).join(" ");
  const recommendationRecipes = useMemo(() => {
    const candidates = [...recipes, ...favorites];
    const seen = new Set();
    return candidates.filter((recipe) => {
      const id = recipe?.id || recipe?.idMeal || recipe?.title || recipe?.strMeal;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [favorites, recipes]);
  const recommendations = useMemo(() => getRecipeRecommendations(
    recommendationRecipes,
    {
      preferredArea: filters.cuisine,
      preferredCategory: filters.category || filters.dietary,
      preferredIngredients: filters.ingredient ? [filters.ingredient] : []
    },
    favorites,
    5
  ), [favorites, filters.category, filters.cuisine, filters.dietary, filters.ingredient, recommendationRecipes]);

  const handleQueryChange = useCallback((nextQuery) => {
    setActiveBrowse("");
    setQuery(nextQuery);
  }, []);
  const handleFiltersChange = useCallback((nextFilters) => {
    setActiveBrowse("");
    setFilters(nextFilters);
  }, []);
  const clearFilters = useCallback(() => {
    setActiveBrowse("");
    setFilters(SEARCH_CONFIG.INITIAL_FILTERS);
    setQuery("");
  }, []);
  const searchFeaturedCategory = useCallback((category) => {
    if (activeBrowse === category.label) return;
    setActiveBrowse(category.label);
    setFilters((currentFilters) => ({ ...currentFilters, ...(category.filters || {}) }));
    setQuery(category.filters ? "" : category.query);
  }, [activeBrowse]);

  return (
    <section className={styles.home}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>YOUR KITCHEN COMPANION</p>
        <h1>Discover your next <em>favourite</em> recipe.</h1>
        <p>Search ideas, explore global cuisines, and build your weekly menu.</p>
      </header>
      <div className={styles.searchPanel}><SearchBar value={query} onChange={handleQueryChange} /></div>
      <section className={styles.featured} aria-labelledby="featured-searches">
        <div className={styles.featuredHeading}>
          <h2 id="featured-searches">Browse popular food ideas</h2>
          <p>Pick a category to discover more recipes.</p>
        </div>
        <div className={styles.chips}>
          {FEATURED_SEARCHES.map((category) => (
            <button
              className={activeBrowse === category.label || query.toLowerCase() === category.query.toLowerCase() ? styles.activeChip : ""}
              key={category.label}
              type="button"
              onClick={() => searchFeaturedCategory(category)}
            >
              <span aria-hidden="true">{category.icon}</span> {category.label}
            </button>
          ))}
        </div>
      </section>
      <Filters filters={filters} onChange={handleFiltersChange} onClear={clearFilters} />
      <section className={styles.recommendations} aria-labelledby="recommended-recipes">
        <div className={styles.recommendationHeading}>
          <h2 id="recommended-recipes">Recommended for you</h2>
          <p>Based on your saved recipes and current preferences.</p>
        </div>
        {recommendations.length > 0 ? <div className={styles.grid}>{recommendations.map((recipe) => <RecipeCard key={recipe.id || recipe.idMeal || recipe.title} recipe={recipe} showRecommendationExplanation />)}</div> : <p className={styles.recommendationEmpty}>Search for recipes or save a favorite to start building recommendations.</p>}
      </section>
      {error && <p className={styles.error} role="alert">{error}</p>}
      {!hasActiveSearch && <p className={styles.helper}>Start by searching for an ingredient, cuisine, or dish.</p>}
      {(visibleRecipes.length > 0 || loading) && <div className={styles.resultsHeader}><p>{loading ? "Finding delicious recipes…" : `${visibleRecipes.length} ${resultDescriptor ? `${resultDescriptor} ` : ""}recipe${visibleRecipes.length === 1 ? "" : "s"} found`}</p><span>Browse recipes by category and area.</span></div>}
      <div className={styles.grid}>{loading && !recipes.length && Array.from({ length: 8 }, (_, index) => <SkeletonCard key={index} />)}{visibleRecipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} showAIInsight />)}</div>
      {hasActiveSearch && !loading && !error && visibleRecipes.length === 0 && <p className={styles.empty}>No recipes matched your search. Try a different recipe name, ingredient, category, or area.</p>}
    </section>
  );
}

export default Home;
