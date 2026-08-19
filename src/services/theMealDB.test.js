import { clearMealDbCache, searchRecipes } from "./theMealDB";

const meal = {
  idMeal: "52771",
  strMeal: "Spicy Arrabiata Penne",
  strMealThumb: "https://example.com/arrabiata.jpg",
  strCategory: "Vegetarian",
  strArea: "Italian",
  strIngredient1: "penne rigate",
  strMeasure1: "1 pound"
};

function mockMeals(meals) {
  global.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ meals })
  });
}

beforeEach(() => {
  global.fetch = jest.fn();
  clearMealDbCache();
});

test("searches recipe names with TheMealDB's name endpoint", async () => {
  mockMeals([meal]);

  const result = await searchRecipes("Arrabiata");

  expect(global.fetch).toHaveBeenCalledWith("https://www.themealdb.com/api/json/v1/1/search.php?s=Arrabiata");
  expect(result).toEqual(expect.objectContaining({
    error: null,
    data: expect.objectContaining({
      results: [expect.objectContaining({ id: "52771", title: "Spicy Arrabiata Penne", cuisine: "Italian" })]
    })
  }));
});

test.each([
  ["category", { category: "Dessert" }, "filter.php?c=Dessert"],
  ["area", { cuisine: "Indian" }, "filter.php?a=India"],
  ["ingredient", { ingredient: "Chicken" }, "filter.php?i=Chicken"]
])("uses TheMealDB's %s filter endpoint", async (_filterName, filters, endpoint) => {
  mockMeals([meal]);

  const result = await searchRecipes("", filters);

  expect(global.fetch).toHaveBeenCalledWith(`https://www.themealdb.com/api/json/v1/1/${endpoint}`);
  if (_filterName === "area") expect(result.data.results.length).toBeGreaterThanOrEqual(20);
  else expect(result.data.results).toHaveLength(1);
  expect(result.error).toBeNull();
});

test("returns a helpful network error", async () => {
  global.fetch.mockRejectedValue(new TypeError("Failed to fetch"));

  const result = await searchRecipes("network-test");

  expect(result).toEqual({ data: null, error: "Unable to reach TheMealDB. Check your connection and try again." });
});

test("shares an in-flight request for the same search", async () => {
  let resolveFetch;
  global.fetch.mockImplementation(() => new Promise((resolve) => {
    resolveFetch = resolve;
  }));

  const firstSearch = searchRecipes("shared-request");
  const secondSearch = searchRecipes("shared-request");

  expect(global.fetch).toHaveBeenCalledTimes(1);

  resolveFetch({ ok: true, json: async () => ({ meals: [meal] }) });

  await expect(firstSearch).resolves.toEqual(expect.objectContaining({ error: null }));
  await expect(secondSearch).resolves.toEqual(expect.objectContaining({ error: null }));
});

test("deduplicates repeated TheMealDB meals while preserving unique results", async () => {
  mockMeals([meal, { ...meal, strMeal: "Spicy Arrabiata Penne copy" }, { ...meal, idMeal: "52772", strMeal: "Another Penne" }]);

  const result = await searchRecipes("dedupe-test");

  expect(result.data.results.map((recipe) => recipe.id)).toEqual(["52771", "52772"]);
});

test.each(["pasta", "paneer", "paneers", "dal", "dals", "daal", "fish", "indian", "India"])("guarantees 20 unique curated/API results for %s when API coverage is sparse", async (query) => {
  global.fetch.mockResolvedValue({ ok: true, json: async () => ({ meals: [] }) });

  const result = await searchRecipes(query);
  const ids = result.data.results.map((recipe) => recipe.id);

  expect(result.error).toBeNull();
  expect(ids.length).toBeGreaterThanOrEqual(20);
  expect(new Set(ids).size).toBe(ids.length);
});

test("normalizes Indian area queries and combines API data with fallback coverage", async () => {
  const indianMeal = { ...meal, idMeal: "india-api", strMeal: "Indian API Dish", strArea: "India" };
  global.fetch.mockImplementation((url) => Promise.resolve({
    ok: true,
    json: async () => ({ meals: url.includes("filter.php?a=India") ? [indianMeal] : [] })
  }));

  const [lowercase, countryName] = await Promise.all([searchRecipes("indian"), searchRecipes("India")]);

  expect(lowercase.data.results).toEqual(expect.arrayContaining([expect.objectContaining({ id: "india-api", cuisine: "India" })]));
  expect(lowercase.data.results.length).toBeGreaterThanOrEqual(20);
  expect(countryName.data.results.length).toBeGreaterThanOrEqual(20);
  expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("filter.php?a=India"));
});

test("keeps normal name searches working alongside coverage expansion", async () => {
  global.fetch.mockImplementation((url) => Promise.resolve({
    ok: true,
    json: async () => ({ meals: url.includes("search.php?s=chicken") || url.includes("filter.php?c=") ? [meal] : [] })
  }));

  for (const query of ["chicken", "dessert", "vegetarian"]) {
    const result = await searchRecipes(query);
    expect(result.error).toBeNull();
    expect(result.data.results.length).toBeGreaterThan(0);
  }
});

test("matches India and Indian area names case-insensitively without loose substring matches", async () => {
  const indianMeal = { ...meal, idMeal: "india-1", strArea: "India", strMeal: "Indian Dish" };
  const italianMeal = { ...meal, idMeal: "italy-1", strArea: "Italian", strMeal: "Italian Dish" };
  global.fetch.mockImplementation((url) => Promise.resolve({
    ok: true,
    json: async () => ({ meals: url.includes("search.php?s=chicken") ? [indianMeal, italianMeal] : [] })
  }));

  const indianResult = await searchRecipes("chicken", { cuisine: "  INDIAN  " });
  const italianResult = await searchRecipes("chicken", { cuisine: "Italian" });

  expect(indianResult.data.results.map((recipe) => recipe.id)).toEqual(["india-1"]);
  expect(italianResult.data.results.map((recipe) => recipe.id)).toEqual(["italy-1"]);
});

test("intersects area, category, and ingredient filter endpoints", async () => {
  const matching = { ...meal, idMeal: "match", strMeal: "Paneer Match", strArea: "India" };
  const other = { ...meal, idMeal: "other", strMeal: "Paneer Other", strArea: "India" };
  global.fetch.mockImplementation((url) => Promise.resolve({
    ok: true,
    json: async () => ({ meals: url.includes("filter.php?c=Vegetarian") ? [matching, other] : url.includes("filter.php?a=India") ? [matching] : url.includes("filter.php?i=Paneer") ? [matching, other] : [] })
  }));

  const result = await searchRecipes("", { cuisine: "Indian", category: "Vegetarian", ingredient: "Paneer" });

  expect(result.data.results.map((recipe) => recipe.id)).toEqual(["match"]);
});

test("uses the pasta coverage set for the Pasta category when the category endpoint is sparse", async () => {
  global.fetch.mockResolvedValue({ ok: true, json: async () => ({ meals: [] }) });

  const result = await searchRecipes("", { category: "Pasta" });

  expect(result.data.results.length).toBeGreaterThanOrEqual(20);
  expect(result.data.results.every((recipe) => recipe.category === "Pasta")).toBe(true);
});
