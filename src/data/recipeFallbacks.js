/*
 * TheMealDB's free catalogue has sparse coverage for a few common search
 * terms. These are real, stable recipe names kept separate from API results
 * so the search layer can fill only genuine coverage gaps.
 */
const fallbackDefinitions = [
  ["paneer-01", "Matar Paneer", "Indian", "Main", ["paneer", "peas", "tomato"]],
  ["paneer-02", "Palak Paneer", "Indian", "Main", ["paneer", "spinach", "onion"]],
  ["paneer-03", "Paneer Tikka", "Indian", "Starter", ["paneer", "yogurt", "pepper"]],
  ["paneer-04", "Paneer Butter Masala", "Indian", "Main", ["paneer", "tomato", "butter"]],
  ["paneer-05", "Shahi Paneer", "Indian", "Main", ["paneer", "cashew", "cream"]],
  ["paneer-06", "Kadai Paneer", "Indian", "Main", ["paneer", "pepper", "onion"]],
  ["paneer-07", "Chilli Paneer", "Indian", "Starter", ["paneer", "chilli", "spring onion"]],
  ["paneer-08", "Paneer Bhurji", "Indian", "Main", ["paneer", "tomato", "onion"]],
  ["paneer-09", "Paneer Kofta", "Indian", "Main", ["paneer", "potato", "tomato"]],
  ["paneer-10", "Paneer Lababdar", "Indian", "Main", ["paneer", "tomato", "cream"]],
  ["paneer-11", "Paneer Do Pyaza", "Indian", "Main", ["paneer", "onion", "yogurt"]],
  ["paneer-12", "Paneer Jalfrezi", "Indian", "Main", ["paneer", "bell pepper", "tomato"]],
  ["paneer-13", "Paneer Korma", "Indian", "Main", ["paneer", "cashew", "coconut"]],
  ["paneer-14", "Paneer Pasanda", "Indian", "Main", ["paneer", "almond", "cream"]],
  ["paneer-15", "Paneer Tikka Masala", "Indian", "Main", ["paneer", "tomato", "yogurt"]],
  ["paneer-16", "Paneer Handi", "Indian", "Main", ["paneer", "tomato", "cream"]],
  ["paneer-17", "Achari Paneer", "Indian", "Main", ["paneer", "pickle spices", "onion"]],
  ["paneer-18", "Malai Paneer", "Indian", "Main", ["paneer", "cream", "cardamom"]],
  ["paneer-19", "Paneer Paratha", "Indian", "Breakfast", ["paneer", "flour", "coriander"]],
  ["paneer-20", "Paneer Kulcha", "Indian", "Breakfast", ["paneer", "flour", "yogurt"]],

  ["dal-01", "Dal Fry", "Indian", "Main", ["dal", "lentils", "tomato"]],
  ["dal-02", "Dal Tadka", "Indian", "Main", ["dal", "lentils", "garlic"]],
  ["dal-03", "Dal Makhani", "Indian", "Main", ["dal", "black lentils", "butter"]],
  ["dal-04", "Chana Dal", "Indian", "Main", ["dal", "chickpeas", "cumin"]],
  ["dal-05", "Moong Dal", "Indian", "Main", ["dal", "mung lentils", "ginger"]],
  ["dal-06", "Masoor Dal", "Indian", "Main", ["dal", "red lentils", "tomato"]],
  ["dal-07", "Toor Dal", "Indian", "Main", ["dal", "toor lentils", "turmeric"]],
  ["dal-08", "Dhaba Dal", "Indian", "Main", ["dal", "lentils", "onion"]],
  ["dal-09", "Panchmel Dal", "Indian", "Main", ["dal", "mixed lentils", "spices"]],
  ["dal-10", "Dal Palak", "Indian", "Main", ["dal", "lentils", "spinach"]],
  ["dal-11", "Dal Baati", "Indian", "Main", ["dal", "lentils", "wheat flour"]],
  ["dal-12", "Dal Dhokli", "Indian", "Main", ["dal", "lentils", "wheat flour"]],
  ["dal-13", "Gujarati Dal", "Indian", "Main", ["dal", "lentils", "peanuts"]],
  ["dal-14", "Bengali Dal", "Indian", "Main", ["dal", "lentils", "mustard"]],
  ["dal-15", "Amti Dal", "Indian", "Main", ["dal", "lentils", "coconut"]],
  ["dal-16", "Sambar", "Indian", "Main", ["dal", "lentils", "vegetables"]],
  ["dal-17", "Khichdi", "Indian", "Main", ["dal", "rice", "ghee"]],
  ["dal-18", "Lentil Curry", "Indian", "Main", ["dal", "lentils", "coconut milk"]],
  ["dal-19", "Red Lentil Soup", "Global", "Soup", ["dal", "red lentils", "carrot"]],
  ["dal-20", "Dal Gosht", "Indian", "Main", ["dal", "lentils", "lamb"]],

  ["pasta-01", "Spaghetti Bolognese", "Italian", "Pasta", ["pasta", "spaghetti", "beef"]],
  ["pasta-02", "Spaghetti Carbonara", "Italian", "Pasta", ["pasta", "spaghetti", "egg"]],
  ["pasta-03", "Aglio e Olio", "Italian", "Pasta", ["pasta", "spaghetti", "garlic"]],
  ["pasta-04", "Pesto Pasta", "Italian", "Pasta", ["pasta", "basil", "parmesan"]],
  ["pasta-05", "Classic Lasagna", "Italian", "Pasta", ["pasta", "lasagna", "beef"]],
  ["pasta-06", "Macaroni and Cheese", "American", "Pasta", ["pasta", "macaroni", "cheese"]],
  ["pasta-07", "Pasta Primavera", "Italian", "Pasta", ["pasta", "vegetables", "parmesan"]],
  ["pasta-08", "Penne Arrabbiata", "Italian", "Pasta", ["pasta", "penne", "tomato"]],
  ["pasta-09", "Fettuccine Alfredo", "Italian", "Pasta", ["pasta", "fettuccine", "cream"]],
  ["pasta-10", "Linguine with Clams", "Italian", "Pasta", ["pasta", "linguine", "clams"]],
  ["pasta-11", "Tagliatelle al Ragu", "Italian", "Pasta", ["pasta", "tagliatelle", "beef"]],
  ["pasta-12", "Pasta alla Norma", "Italian", "Pasta", ["pasta", "eggplant", "tomato"]],
  ["pasta-13", "Cacio e Pepe", "Italian", "Pasta", ["pasta", "pecorino", "pepper"]],
  ["pasta-14", "Ravioli al Pomodoro", "Italian", "Pasta", ["pasta", "ravioli", "tomato"]],
  ["pasta-15", "Tortellini Primavera", "Italian", "Pasta", ["pasta", "tortellini", "vegetables"]],
  ["pasta-16", "Pasta Puttanesca", "Italian", "Pasta", ["pasta", "olives", "tomato"]],
  ["pasta-17", "Orzo Pasta Salad", "Italian", "Pasta", ["pasta", "orzo", "cucumber"]],
  ["pasta-18", "Baked Ziti", "Italian", "Pasta", ["pasta", "ziti", "mozzarella"]],
  ["pasta-19", "Gnocchi with Tomato", "Italian", "Pasta", ["pasta", "gnocchi", "tomato"]],
  ["pasta-20", "Macaroni Salad", "American", "Pasta", ["pasta", "macaroni", "mayonnaise"]],

  ["fish-01", "Fish and Chips", "British", "Main", ["fish", "potato", "flour"]],
  ["fish-02", "Grilled Salmon", "Nordic", "Main", ["fish", "salmon", "lemon"]],
  ["fish-03", "Salmon Teriyaki", "Japanese", "Main", ["fish", "salmon", "soy sauce"]],
  ["fish-04", "Tuna Salad", "American", "Salad", ["fish", "tuna", "lettuce"]],
  ["fish-05", "Tuna Melt", "American", "Lunch", ["fish", "tuna", "cheese"]],
  ["fish-06", "Cod au Gratin", "French", "Main", ["fish", "cod", "cheese"]],
  ["fish-07", "Baked Cod", "Global", "Main", ["fish", "cod", "lemon"]],
  ["fish-08", "Fish Tacos", "Mexican", "Main", ["fish", "white fish", "tortilla"]],
  ["fish-09", "Thai Fish Curry", "Thai", "Main", ["fish", "white fish", "coconut milk"]],
  ["fish-10", "Fish Pie", "British", "Main", ["fish", "white fish", "potato"]],
  ["fish-11", "Mediterranean Fish Stew", "Mediterranean", "Main", ["fish", "tomato", "white fish"]],
  ["fish-12", "Goan Fish Curry", "Indian", "Main", ["fish", "white fish", "coconut"]],
  ["fish-13", "Grilled Mackerel", "Japanese", "Main", ["fish", "mackerel", "ginger"]],
  ["fish-14", "Prawn Curry", "Indian", "Main", ["fish", "prawns", "coconut"]],
  ["fish-15", "Garlic Prawns", "Spanish", "Starter", ["fish", "prawns", "garlic"]],
  ["fish-16", "Shrimp Scampi", "Italian", "Main", ["fish", "shrimp", "garlic"]],
  ["fish-17", "Seafood Paella", "Spanish", "Main", ["fish", "prawns", "rice"]],
  ["fish-18", "Cioppino", "American", "Main", ["fish", "seafood", "tomato"]],
  ["fish-19", "Lobster Roll", "American", "Lunch", ["fish", "lobster", "bread"]],
  ["fish-20", "Crab Cakes", "American", "Starter", ["fish", "crab", "breadcrumbs"]]
];

function createFallbackRecipe([id, title, cuisine, category, ingredientNames]) {
  return {
    id: `local-${id}`,
    title,
    image: "",
    cuisines: [cuisine],
    cuisine,
    category,
    readyInMinutes: null,
    servings: 1,
    extendedIngredients: ingredientNames.map((name, index) => ({
      id: `local-${id}-${index + 1}`,
      name,
      nameClean: name,
      amount: "",
      unit: "",
      original: name
    })),
    analyzedInstructions: [],
    instructions: "Instructions are not available for this curated coverage recipe.",
    nutrition: null,
    source: "curated-fallback"
  };
}

const fallbackRecipes = fallbackDefinitions.map(createFallbackRecipe);

export function getFallbackRecipesForGroup(group) {
  if (group === "indian") return fallbackRecipes.filter((recipe) => recipe.cuisine.toLowerCase() === "indian");
  return fallbackRecipes.filter((recipe) => recipe.id.startsWith(`local-${group}-`));
}

export function getFallbackRecipeById(id) {
  return fallbackRecipes.find((recipe) => recipe.id === id) || null;
}

export default fallbackRecipes;
