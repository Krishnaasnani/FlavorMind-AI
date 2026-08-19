export function getRecipeId(recipe) {
  return recipe?.id || recipe?.idMeal;
}

export function getRecipeTitle(recipe) {
  return recipe?.title || recipe?.name || "Untitled recipe";
}
