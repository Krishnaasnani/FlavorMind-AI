import { API_CONFIG } from "../constants";
import { getFallbackRecipeById, getFallbackRecipesForGroup } from "../data/recipeFallbacks";

const CACHE_DURATION_MS = 60_000;
const responseCache = new Map();
const inFlightRequests = new Map();

export function clearMealDbCache() {
  responseCache.clear();
  inFlightRequests.clear();
}

function getErrorMessage(payload, fallbackMessage) {
  return payload?.message || fallbackMessage;
}

function normaliseMeasure(measure) {
  const cleanMeasure = measure?.trim() || "";
  const match = cleanMeasure.match(/^(\d+(?:\.\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+)(?:\s+(.*))?$/);

  if (!match) return { amount: "", unit: cleanMeasure };

  const [whole, fraction] = match[1].split(/\s+/);
  const fractionParts = (fraction || whole.includes("/") ? fraction || whole : "").split("/");
  const fractionalAmount = fractionParts.length === 2 ? Number(fractionParts[0]) / Number(fractionParts[1]) : 0;
  const wholeAmount = fraction ? Number(whole) : whole.includes("/") ? 0 : Number(whole);

  return {
    amount: Number.isFinite(wholeAmount + fractionalAmount) ? wholeAmount + fractionalAmount : cleanMeasure,
    unit: match[2] || ""
  };
}

function getIngredients(meal) {
  return Array.from({ length: 20 }, (_, index) => index + 1)
    .map((index) => {
      const name = meal[`strIngredient${index}`]?.trim();
      const measure = meal[`strMeasure${index}`]?.trim() || "";

      if (!name) return null;

      const { amount, unit } = normaliseMeasure(measure);
      return {
        id: `${meal.idMeal}-${index}`,
        name,
        nameClean: name,
        amount,
        unit,
        original: `${measure} ${name}`.trim()
      };
    })
    .filter(Boolean);
}

function getInstructionSteps(instructions) {
  return instructions
    .split(/\r?\n+/)
    .map((step) => step.trim())
    .filter(Boolean)
    .map((step, index) => ({ number: index + 1, step }));
}

function mapMeal(meal, hints = {}) {
  if (!meal?.idMeal) return null;

  const cuisine = meal.strArea || meal.strCountry || hints.cuisine || "";
  const instructions = meal.strInstructions?.trim() || "";

  return {
    id: meal.idMeal,
    title: meal.strMeal || "Untitled recipe",
    image: meal.strMealThumb || "",
    cuisines: cuisine ? [cuisine] : [],
    cuisine,
    category: meal.strCategory || hints.category || "",
    readyInMinutes: null,
    servings: 1,
    extendedIngredients: getIngredients(meal),
    analyzedInstructions: instructions ? [{ name: "Instructions", steps: getInstructionSteps(instructions) }] : [],
    instructions,
    nutrition: null
  };
}

async function mealDbRequest(path, params = {}, options = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  const cacheKey = `${path}?${query}`;
  const cachedResponse = responseCache.get(cacheKey);

  if (cachedResponse && Date.now() - cachedResponse.savedAt < CACHE_DURATION_MS) {
    return { data: cachedResponse.data, error: null };
  }

  if (cachedResponse) responseCache.delete(cacheKey);

  let request = inFlightRequests.get(cacheKey);

  if (!request) {
    request = fetch(`${API_CONFIG.THEMEALDB_BASE_URL}${path}${query ? `?${query}` : ""}`)
      .then(async (response) => {
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          return { data: null, error: getErrorMessage(payload, "TheMealDB could not complete this search. Please try again.") };
        }
        if (!payload) return { data: null, error: "TheMealDB returned an invalid response. Please try again." };

        responseCache.set(cacheKey, { data: payload, savedAt: Date.now() });
        return { data: payload, error: null };
      })
      .catch(() => ({ data: null, error: "Unable to reach TheMealDB. Check your connection and try again." }))
      .finally(() => inFlightRequests.delete(cacheKey));

    inFlightRequests.set(cacheKey, request);
  }

  if (!options.signal) return request;
  if (options.signal.aborted) return { data: null, error: null, aborted: true };

  return new Promise((resolve) => {
    const abortRequest = () => resolve({ data: null, error: null, aborted: true });
    options.signal.addEventListener("abort", abortRequest, { once: true });

    request.then((result) => {
      options.signal.removeEventListener("abort", abortRequest);
      resolve(result);
    });
  });
}

function searchResult(meals) {
  const seen = new Set();
  const uniqueMeals = meals.filter((meal) => {
    const id = String(meal?.id || meal?.idMeal || "").trim().toLowerCase();
    const title = String(meal?.title || meal?.strMeal || "").trim().toLowerCase();
    const keys = [id && `id:${id}`, title && `title:${title}`].filter(Boolean);
    if (!keys.length || keys.some((key) => seen.has(key))) return false;
    keys.forEach((key) => seen.add(key));
    return true;
  });
  return {
    results: uniqueMeals,
    totalResults: uniqueMeals.length
  };
}

async function getFilteredMeals(filter, value, hints = {}, options = {}) {
  const { data, error, aborted } = await mealDbRequest("filter.php", { [filter]: value }, options);
  if (error || aborted) return { data: null, error, aborted };

  return { data: (data?.meals || []).map((meal) => mapMeal(meal, hints)), error: null };
}

function matchesFilters(meal, filters) {
  const categoryMatches = !filters.category || normalisedText(meal.category) === normalisedText(filters.category);
  const cuisineMatches = !filters.cuisine || normaliseArea(meal.cuisine) === normaliseArea(filters.cuisine);
  const ingredientMatches = !filters.ingredient || meal.extendedIngredients.some((item) => ingredientMatchesTerm(item.name, filters.ingredient));
  const dietaryMatches = !filters.dietary || normalisedText(meal.category) === normalisedText(filters.dietary);

  return categoryMatches && cuisineMatches && ingredientMatches && dietaryMatches;
}

function normalisedText(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

const areaAliases = {
  india: "indian",
  indian: "indian",
  "united states": "american",
  usa: "american",
  american: "american",
  "united kingdom": "british",
  uk: "british",
  british: "british"
};

const areaApiValues = {
  indian: "India",
  american: "United States",
  british: "United Kingdom"
};

function normaliseArea(value) {
  const cleanValue = normalisedText(value);
  return areaAliases[cleanValue] || cleanValue;
}

function areaApiValue(value) {
  const canonical = normaliseArea(value);
  return areaApiValues[canonical] || String(value || "").trim();
}

function ingredientTerms(value) {
  const cleanValue = normalisedText(value);
  if (["dal", "dals", "daal", "lentil", "lentils"].includes(cleanValue)) return ["dal", "daal", "lentil", "chickpea"];
  if (["pasta", "pastas"].includes(cleanValue)) return ["pasta", "spaghetti", "macaroni", "noodle", "fettuccine", "linguine", "vermicelli"];
  if (["fish", "fishes"].includes(cleanValue)) return ["fish", "seafood", "salmon", "tuna", "cod", "prawn", "shrimp", "mackerel"];
  if (["paneer", "paneers"].includes(cleanValue)) return ["paneer"];
  return [cleanValue];
}

function ingredientMatchesTerm(name, wanted) {
  const ingredientName = normalisedText(name);
  return ingredientTerms(wanted).some((term) => ingredientName === term || ingredientName.includes(term));
}

function recipeId(recipe) {
  return String(recipe?.id || recipe?.idMeal || "").trim().toLowerCase();
}

const coverageStrategies = {
  pasta: [
    ["search.php", { s: "pasta" }],
    ["filter.php", { i: "Spaghetti" }],
    ["filter.php", { i: "Macaroni" }],
    ["filter.php", { i: "Fettuccine" }],
    ["filter.php", { i: "Noodles" }],
    ["filter.php", { i: "Vermicelli Pasta" }],
    ["filter.php", { i: "Linguine Pasta" }]
  ],
  paneer: [
    ["search.php", { s: "paneer" }],
    ["filter.php", { i: "Paneer" }]
  ],
  dal: [
    ["search.php", { s: "dal" }],
    ["filter.php", { i: "Brown Lentils" }],
    ["filter.php", { i: "French Lentils" }],
    ["filter.php", { i: "Green Red Lentils" }],
    ["filter.php", { i: "Toor Dal" }],
    ["filter.php", { i: "Lentils" }],
    ["filter.php", { i: "Chickpeas" }]
  ],
  fish: [
    ["search.php", { s: "fish" }],
    ["filter.php", { i: "Salmon" }],
    ["filter.php", { i: "Tuna" }],
    ["filter.php", { i: "Cod" }],
    ["filter.php", { i: "Prawns" }]
  ],
  indian: [
    ["filter.php", { a: "India" }],
    ["search.php", { s: "Indian" }]
  ]
};

const categorySearchAliases = {
  dessert: "Dessert",
  vegetarian: "Vegetarian"
};

const dietaryCategories = new Set(["vegetarian", "vegan", "seafood", "chicken", "dessert"]);

function normalizedSearchTerm(value) {
  return String(value || "").trim().toLowerCase().replace(/[\s-]+/g, " ");
}

function coverageGroupFor(query, filters = {}) {
  const candidate = normalizedSearchTerm(query || filters.ingredient || filters.cuisine || filters.category);
  if (["pasta", "pastas"].includes(candidate)) return "pasta";
  if (["paneer", "paneers"].includes(candidate)) return "paneer";
  if (["dal", "dals", "daal"].includes(candidate)) return "dal";
  if (["fish", "fishes"].includes(candidate)) return "fish";
  if (["indian", "india"].includes(candidate)) return "indian";
  return "";
}

async function searchCoverageGroup(group, options = {}) {
  const meals = [];
  let lastError = null;

  for (const [path, params] of coverageStrategies[group]) {
    const result = await mealDbRequest(path, params, options);
    if (result.aborted) return result;
    if (result.error) {
      lastError = result.error;
      continue;
    }

    meals.push(...(result.data?.meals || []).map((meal) => mapMeal(meal)).filter(Boolean));
    if (searchResult(meals).results.length >= 20) break;
  }

  const uniqueApiMeals = searchResult(meals).results;
  const fallbackMeals = uniqueApiMeals.length < 20 ? getFallbackRecipesForGroup(group) : [];
  const combined = searchResult([...uniqueApiMeals, ...fallbackMeals]);

  if (combined.results.length > 0) return { data: combined, error: null };
  return { data: null, error: lastError || "No matching recipes were found." };
}

async function searchByFilters(filters, options = {}) {
  const requests = [];
  if (filters.category) requests.push(["category", "filter.php", { c: filters.category }]);
  if (filters.dietary && dietaryCategories.has(normalisedText(filters.dietary))) requests.push(["dietary", "filter.php", { c: filters.dietary }]);
  if (filters.cuisine) requests.push(["cuisine", "filter.php", { a: areaApiValue(filters.cuisine) }]);
  if (filters.ingredient) requests.push(["ingredient", "filter.php", { i: filters.ingredient }]);
  if (!requests.length) return { data: searchResult([]), error: null };

  const responses = await Promise.all(requests.map(([, path, params]) => mealDbRequest(path, params, options)));
  const failedResponse = responses.find((result) => result.error && !result.aborted);
  if (responses.some((result) => result.aborted)) return { data: null, error: null, aborted: true };
  if (failedResponse) return { data: null, error: failedResponse.error };

  const mealSets = responses.map((result) => (result.data?.meals || []).map((meal) => mapMeal(meal)).filter(Boolean));
  const commonIds = mealSets.slice(1).reduce((ids, meals) => {
    const currentIds = new Set(meals.map(recipeId));
    return ids.filter((id) => currentIds.has(id));
  }, mealSets[0].map(recipeId));
  const mealById = new Map(mealSets.flat().map((meal) => [recipeId(meal), meal]));
  const combined = commonIds.map((id) => mealById.get(id)).filter(Boolean);

  return { data: searchResult(combined), error: null };
}

/** Searches meals by name, ingredient, category, area, or a safe filter combination. */
export async function searchRecipes(query, filters = {}, options = {}) {
  const normalizedQuery = query?.trim();
  const category = filters.category?.trim();
  const cuisine = filters.cuisine?.trim();
  const ingredient = filters.ingredient?.trim();

  if (!normalizedQuery && !category && !cuisine && !ingredient && !filters.dietary) {
    return { data: searchResult([]), error: null };
  }

  const coverageGroup = coverageGroupFor(normalizedQuery, filters);
  const activeFilterCount = [category, cuisine, ingredient, filters.dietary].filter(Boolean).length;
  const hasAdditionalFilters = activeFilterCount > (normalizedQuery ? 0 : 1);
  if (coverageGroup && !hasAdditionalFilters) {
    return searchCoverageGroup(coverageGroup, options);
  }

  if (normalizedQuery && !hasAdditionalFilters) {
    const categoryAlias = categorySearchAliases[normalizedSearchTerm(normalizedQuery)];
    if (categoryAlias) {
      const categoryResult = await getFilteredMeals("c", categoryAlias, { category: categoryAlias }, options);
      if (categoryResult.error || categoryResult.aborted) return categoryResult;
      return { data: searchResult(categoryResult.data), error: null };
    }
  }

  if (normalizedQuery) {
    const nameResult = await mealDbRequest("search.php", { s: normalizedQuery }, options);
    if (nameResult.error || nameResult.aborted) return nameResult;

    const namedMeals = (nameResult.data?.meals || []).map((meal) => mapMeal(meal));
    if (namedMeals.length) {
      return { data: searchResult(namedMeals.filter((meal) => matchesFilters(meal, { category, cuisine, ingredient, dietary: filters.dietary }))), error: null };
    }

    // A single keyword can also be an ingredient. Only use this fallback when
    // no separate browse filter is active, so we never mix unrelated API calls.
    if (!category && !cuisine && !ingredient) {
      const ingredientResult = await getFilteredMeals("i", normalizedQuery, {}, options);
      if (ingredientResult.error || ingredientResult.aborted) return ingredientResult;
      return { data: searchResult(ingredientResult.data), error: null };
    }

    return { data: searchResult([]), error: null };
  }

  return searchByFilters({ category, cuisine, ingredient, dietary: filters.dietary }, options);
}

/** Fetches complete recipe details by TheMealDB meal ID. */
export async function getRecipeById(id) {
  if (!id) return { data: null, error: "A recipe id is required." };

  const fallbackRecipe = getFallbackRecipeById(id);
  if (fallbackRecipe) return { data: fallbackRecipe, error: null };

  const { data, error } = await mealDbRequest("lookup.php", { i: id });
  if (error) return { data: null, error };

  const meal = mapMeal(data?.meals?.[0]);
  return meal ? { data: meal, error: null } : { data: null, error: "Recipe not found." };
}

/** TheMealDB does not provide nutrition data in its free V1 API. */
export function getRecipeNutrition(id) {
  if (!id) return Promise.resolve({ data: null, error: "A recipe id is required." });
  return Promise.resolve({ data: null, error: null });
}

export async function getMealCategories() {
  const { data, error } = await mealDbRequest("categories.php");
  if (error) return { data: null, error };

  return {
    data: (data?.categories || []).map((category) => ({
      id: category.idCategory,
      name: category.strCategory,
      image: category.strCategoryThumb,
      description: category.strCategoryDescription
    })),
    error: null
  };
}

export async function getMealAreas() {
  const { data, error } = await mealDbRequest("list.php", { a: "list" });
  return { data: error ? null : (data?.meals || []).map((area) => area.strArea), error };
}

export async function getMainIngredients() {
  const { data, error } = await mealDbRequest("list.php", { i: "list" });
  return { data: error ? null : (data?.meals || []).map((ingredient) => ingredient.strIngredient), error };
}

export async function getRecipesByCategory(category) {
  const result = await getFilteredMeals("c", category, { category });
  return result.error ? result : { data: searchResult(result.data), error: null };
}

export async function getRecipesByArea(area) {
  const result = await getFilteredMeals("a", area, { cuisine: area });
  return result.error ? result : { data: searchResult(result.data), error: null };
}

export async function getRecipesByMainIngredient(ingredient) {
  const result = await getFilteredMeals("i", ingredient);
  return result.error ? result : { data: searchResult(result.data), error: null };
}

export async function getRandomRecipe() {
  const { data, error } = await mealDbRequest("random.php");
  if (error) return { data: null, error };

  const meal = mapMeal(data?.meals?.[0]);
  return meal ? { data: meal, error: null } : { data: null, error: "Recipe not found." };
}
