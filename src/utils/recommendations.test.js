import { getRecipeRecommendations, scoreRecipe } from "./recommendations";

const chickenRice = {
  idMeal: "1",
  strMeal: "Chicken Rice",
  strArea: "Indian",
  strCategory: "Main",
  strIngredient1: "Chicken",
  strIngredient2: "Rice"
};

test("scores area, category, and preferred ingredient matches transparently", () => {
  const result = scoreRecipe(chickenRice, {
    preferredCuisine: "Indian",
    preferredCategory: "Main",
    preferredIngredients: ["chicken", "pepper"]
  });

  expect(result.score).toBe(7);
  expect(result.breakdown).toEqual({ area: 3, category: 2, preferredIngredients: 2, favoriteIngredients: 0 });
  expect(result.matches.preferredIngredients).toEqual(["chicken"]);
});

test("uses favorite ingredients as a small similarity signal and sorts by score", () => {
  const recommendations = getRecipeRecommendations([
    { id: "low", title: "Plain Salad", cuisine: "French", category: "Side", extendedIngredients: [{ name: "lettuce" }] },
    { id: "top", title: "Chicken Rice", cuisine: "Indian", category: "Main", extendedIngredients: [{ name: "chicken" }, { name: "rice" }] }
  ], { preferredArea: "Indian" }, [{ extendedIngredients: [{ name: "Chicken" }, { name: "Rice" }] }], 1);

  expect(recommendations).toHaveLength(1);
  expect(recommendations[0]).toEqual(expect.objectContaining({ id: "top", score: 5, recommendationScore: 5 }));
  expect(recommendations[0].recommendationBreakdown).toEqual({ area: 3, category: 0, preferredIngredients: 0, favoriteIngredients: 2 });
});

test("handles mapped recipes and missing preference or recipe fields safely", () => {
  const recommendations = getRecipeRecommendations([
    { id: "mapped", title: "Pasta", cuisines: ["Italian"], category: "Main", extendedIngredients: [{ nameClean: "Tomato" }] },
    null,
    {}
  ], { preferredIngredients: ["tomato", "tomato"] }, [], 5);

  expect(recommendations[0]).toEqual(expect.objectContaining({ id: "mapped", score: 2 }));
  expect(recommendations).toHaveLength(3);
  expect(getRecipeRecommendations(null)).toEqual([]);
  expect(scoreRecipe({}, {}, null).score).toBe(0);
});

test("returns available unique recipes without inventing fillers", () => {
  const recipes = getRecipeRecommendations([
    { id: "one", title: "One" },
    { id: "one", title: "One duplicate" },
    { id: "two", title: "Two" }
  ], {}, [], 5);

  expect(recipes.map((recipe) => recipe.id)).toEqual(["one", "two"]);
});
