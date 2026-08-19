const DEFAULT_LIMIT = 10;

function normalized(value) {
  return String(value ?? "").trim().toLowerCase();
}

function preferenceValues(value) {
  const values = Array.isArray(value) ? value : [value];
  return [...new Set(values.map(normalized).filter(Boolean))];
}

function recipeAreas(recipe) {
  return preferenceValues([
    recipe?.cuisine,
    ...(Array.isArray(recipe?.cuisines) ? recipe.cuisines : []),
    recipe?.strArea,
    recipe?.strCountry
  ]);
}

function recipeCategory(recipe) {
  return normalized(recipe?.category || recipe?.strCategory);
}

function recipeIngredients(recipe) {
  if (Array.isArray(recipe?.extendedIngredients)) {
    return preferenceValues(recipe.extendedIngredients.map((ingredient) => (
      ingredient?.nameClean || ingredient?.name || ingredient?.original
    )));
  }

  return preferenceValues(Array.from({ length: 20 }, (_, index) => recipe?.[`strIngredient${index + 1}`]));
}

function ingredientsMatch(left, right) {
  return left === right || left.includes(right) || right.includes(left);
}

function preferenceIngredients(preferences) {
  return preferenceValues(preferences?.preferredIngredients || preferences?.ingredients);
}

function preferredArea(preferences) {
  return preferenceValues(preferences?.preferredArea || preferences?.preferredCuisine || preferences?.area || preferences?.cuisine);
}

function preferredCategory(preferences) {
  return normalized(preferences?.preferredCategory || preferences?.category);
}

/** Scores one recipe using only the explainable recommendation rules. */
export function scoreRecipe(recipe, preferences = {}, favorites = []) {
  const areas = recipeAreas(recipe);
  const category = recipeCategory(recipe);
  const ingredients = recipeIngredients(recipe);
  const favoriteIngredients = new Set((Array.isArray(favorites) ? favorites : []).flatMap(recipeIngredients));
  const areasWanted = preferredArea(preferences);
  const categoryWanted = preferredCategory(preferences);
  const ingredientsWanted = preferenceIngredients(preferences);

  const areaMatched = areasWanted.length > 0 && areas.some((area) => areasWanted.includes(area));
  const categoryMatched = Boolean(categoryWanted && category === categoryWanted);
  const preferredIngredientMatches = ingredientsWanted.filter((wanted) => ingredients.some((ingredient) => ingredientsMatch(ingredient, wanted)));
  const favoriteIngredientMatches = ingredients.filter((ingredient) => [...favoriteIngredients].some((favorite) => ingredientsMatch(ingredient, favorite)));

  const breakdown = {
    area: areaMatched ? 3 : 0,
    category: categoryMatched ? 2 : 0,
    preferredIngredients: preferredIngredientMatches.length * 2,
    favoriteIngredients: favoriteIngredientMatches.length
  };

  return {
    score: Object.values(breakdown).reduce((total, points) => total + points, 0),
    breakdown,
    matches: {
      area: areaMatched,
      category: categoryMatched,
      preferredIngredients: preferredIngredientMatches,
      favoriteIngredients: favoriteIngredientMatches
    }
  };
}

/** Returns the highest-scoring recipes, retaining score details for display or auditing. */
export function getRecipeRecommendations(recipes = [], preferences = {}, favorites = [], limit = DEFAULT_LIMIT) {
  const requestedLimit = typeof limit === "object" ? limit?.limit : limit;
  const resultLimit = Number.isFinite(Number(requestedLimit)) ? Math.max(0, Number(requestedLimit)) : DEFAULT_LIMIT;

  if (!Array.isArray(recipes) || resultLimit === 0) return [];

  const seen = new Set();
  const uniqueRecipes = recipes.filter((recipe) => {
    const key = normalized(recipe?.id || recipe?.idMeal || recipe?.title || recipe?.strMeal);
    if (!key) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return uniqueRecipes
    .map((recipe, index) => {
      const scored = scoreRecipe(recipe, preferences, Array.isArray(favorites) ? favorites : []);
      return {
        ...recipe,
        score: scored.score,
        recommendationScore: scored.score,
        recommendationBreakdown: scored.breakdown,
        recommendationMatches: scored.matches,
        recommendationIndex: index
      };
    })
    .sort((left, right) => right.score - left.score || left.recommendationIndex - right.recommendationIndex)
    .slice(0, resultLimit)
    .map(({ recommendationIndex, ...recipe }) => recipe);
}

export default getRecipeRecommendations;
