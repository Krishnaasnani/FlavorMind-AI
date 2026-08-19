export const APP_ROUTES = {
  HOME: "/",
  RECIPE_DETAIL: "/recipe/:id",
  FAVORITES: "/favorites",
  MEAL_PLANNER: "/meal-planner",
  SHOPPING_LIST: "/shopping-list",
  LOGIN: "/login",
  SIGNUP: "/signup",
  ACCOUNT: "/account"
};

export const STORAGE_KEYS = {
  FAVORITES: "recipe_favorites",
  MEAL_PLAN: "meal_plan",
  SHOPPING_LIST: "shopping_list",
  THEME: "theme"
};

export const THEMES = {
  LIGHT: "light",
  DARK: "dark"
};

export const API_CONFIG = {
  THEMEALDB_BASE_URL: "https://www.themealdb.com/api/json/v1/1/",
  AI_PROXY_URL: "/api/claude/messages"
};

export const SEARCH_CONFIG = {
  DEBOUNCE_MS: 300,
  INITIAL_FILTERS: { cuisine: "", category: "", ingredient: "", dietary: "" },
  CUISINES: ["", "Indian", "American", "British", "Italian", "Mexican", "Chinese", "French", "Japanese", "Thai", "Canadian", "Greek", "Spanish", "Jamaican", "Moroccan", "Turkish", "Australian"],
  CATEGORIES: ["", "Breakfast", "Chicken", "Dessert", "Pasta", "Seafood", "Vegetarian", "Vegan", "Beef", "Lamb", "Goat", "Miscellaneous"],
  DIETARY: ["", "Vegetarian", "Vegan", "Seafood", "Chicken", "Dessert"]
};

export const FEATURED_SEARCHES = [
  { label: "Paneer", query: "paneer", icon: "🧀", filters: { ingredient: "paneer" } },
  { label: "Dals", query: "dal", icon: "🥣" },
  { label: "Desserts", query: "dessert", icon: "🍰", filters: { category: "Dessert" } },
  { label: "Fish", query: "fish", icon: "🐟", filters: { ingredient: "fish" } },
  { label: "Chicken", query: "chicken", icon: "🍗", filters: { ingredient: "chicken" } },
  { label: "Eggs", query: "egg", icon: "🥚", filters: { ingredient: "egg" } },
  { label: "Seafood", query: "seafood", icon: "🦐", filters: { category: "Seafood" } },
  { label: "Vegetarian", query: "vegetarian", icon: "🥬", filters: { category: "Vegetarian" } },
  { label: "Vegan", query: "vegan", icon: "🌱", filters: { category: "Vegan" } },
  { label: "Rice dishes", query: "rice", icon: "🍚", filters: { ingredient: "rice" } },
  { label: "Pasta", query: "pasta", icon: "🍝", filters: { ingredient: "pasta" } },
  { label: "Indian", query: "Indian", icon: "🫓", filters: { cuisine: "Indian" } },
  { label: "Mexican", query: "Mexican", icon: "🌮", filters: { cuisine: "Mexican" } },
  { label: "Chinese", query: "Chinese", icon: "🥡", filters: { cuisine: "Chinese" } },
  { label: "Breakfast", query: "breakfast", icon: "🍳", filters: { category: "Breakfast" } },
  { label: "Snacks", query: "snack", icon: "🥪" }
];

export const MEAL_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
export const MEAL_TYPES = ["breakfast", "lunch", "dinner"];

export const AI_CONFIG = {
  SUGGESTED_PROMPTS: [
    "What can I make with chicken and spinach?",
    "Suggest a quick 20-min dinner",
    "What's a healthy dessert?"
  ]
};

export const RECIPE_DEFAULTS = {
  CUISINE: "Global",
  RECIPE_NAME: "this recipe"
};

export const UI_TEXT = {
  LOADING_PAGE: "Loading page…",
  NO_AI_INSIGHT: "No AI insights are available for this recipe yet.",
  NO_HEALTH_INSIGHT: "No health observations are available right now."
};
