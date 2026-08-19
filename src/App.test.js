import { render, screen } from "@testing-library/react";
import App from "./App";
import { FavoritesProvider } from "./context/FavoritesContext";
import { MealPlannerProvider } from "./context/MealPlannerContext";
import { ThemeProvider } from "./context/ThemeContext";

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ meals: [] })
  });
});

test("renders the RecipeFinder AI search experience", async () => {
  render(
    <ThemeProvider>
      <FavoritesProvider>
        <MealPlannerProvider>
          <App />
        </MealPlannerProvider>
      </FavoritesProvider>
    </ThemeProvider>
  );
  expect(screen.getByRole("link", { name: /recipefinder ai home/i })).toBeInTheDocument();
  expect(await screen.findByRole("heading", { name: /discover your next favourite recipe/i }, { timeout: 5000 })).toBeInTheDocument();
});
