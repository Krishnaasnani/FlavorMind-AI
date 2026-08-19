import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { FavoritesProvider } from "../context/FavoritesContext";
import { MealPlannerProvider } from "../context/MealPlannerContext";
import { ThemeProvider } from "../context/ThemeContext";
import useRecipeSearch from "../hooks/useRecipeSearch";
import Home from "./Home";

jest.mock("../hooks/useRecipeSearch", () => jest.fn());

function renderHome() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider>
        <FavoritesProvider>
          <MealPlannerProvider>
            <Home />
          </MealPlannerProvider>
        </FavoritesProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  window.localStorage.clear();
  useRecipeSearch.mockReturnValue({ recipes: [], loading: false, error: "" });
});

test("renders scored recommendations from available recipe data", () => {
  useRecipeSearch.mockReturnValue({
    recipes: [
      { id: "1", title: "Chicken Rice", image: "test-image", cuisine: "Indian", category: "Main", extendedIngredients: [{ name: "chicken" }] },
      { id: "2", title: "Plain Salad", image: "test-image", cuisine: "French", category: "Side", extendedIngredients: [{ name: "lettuce" }] },
      { id: "3", title: "Tomato Pasta", image: "test-image", cuisine: "Italian", category: "Main", extendedIngredients: [{ name: "tomato" }] },
      { id: "4", title: "Rice Soup", image: "test-image", cuisine: "Chinese", category: "Soup", extendedIngredients: [{ name: "rice" }] },
      { id: "5", title: "Fruit Bowl", image: "test-image", cuisine: "American", category: "Dessert", extendedIngredients: [{ name: "apple" }] }
    ],
    loading: false,
    error: ""
  });

  renderHome();

  const recommendations = within(screen.getByRole("region", { name: "Recommended for you" }));
  expect(recommendations.getByRole("heading", { name: "Chicken Rice" })).toBeInTheDocument();
  expect(recommendations.getAllByRole("article")).toHaveLength(5);
});

test("shows guidance instead of an error when no recommendation data exists", () => {
  renderHome();

  expect(screen.getByRole("heading", { name: "Recommended for you" })).toBeInTheDocument();
  expect(screen.getByText("Search for recipes or save a favorite to start building recommendations.")).toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
