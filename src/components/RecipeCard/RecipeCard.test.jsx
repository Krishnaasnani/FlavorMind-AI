import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { FavoritesProvider } from "../../context/FavoritesContext";
import { MealPlannerProvider } from "../../context/MealPlannerContext";
import RecipeCard from "./RecipeCard";
import { getRecommendationExplanation } from "../../services/claudeAI";

jest.mock("../../services/claudeAI", () => ({
  getNutritionalInsight: jest.fn(),
  getRecommendationExplanation: jest.fn()
}));

const recipe = {
  id: "1",
  title: "Chicken Rice",
  image: "test-image",
  cuisine: "Indian",
  category: "Main",
  extendedIngredients: [{ name: "chicken" }],
  recommendationScore: 5,
  recommendationMatches: { area: true, category: false, preferredIngredients: ["chicken"], favoriteIngredients: [] },
  recommendationBreakdown: { area: 3, category: 0, preferredIngredients: 2, favoriteIngredients: 0 }
};

function renderCard(props = {}) {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <FavoritesProvider>
        <MealPlannerProvider>
          <RecipeCard recipe={recipe} {...props} />
        </MealPlannerProvider>
      </FavoritesProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  window.localStorage.clear();
  jest.clearAllMocks();
});

test("renders the explanation button only for recommendation cards", () => {
  renderCard({ showRecommendationExplanation: true });
  expect(screen.getByRole("button", { name: "Why this recipe?" })).toBeInTheDocument();
  expect(getRecommendationExplanation).not.toHaveBeenCalled();
});

test("shows a loading state while an explanation is requested", () => {
  getRecommendationExplanation.mockReturnValue(new Promise(() => {}));
  renderCard({ showRecommendationExplanation: true });

  const button = screen.getByRole("button", { name: "Why this recipe?" });
  userEvent.click(button);

  expect(screen.getByRole("button", { name: "Explaining…" })).toBeDisabled();
});

test("shows a successful explanation", async () => {
  getRecommendationExplanation.mockResolvedValue({ data: { explanation: "It matches your Indian cuisine preference." }, error: null });
  renderCard({ showRecommendationExplanation: true });

  userEvent.click(screen.getByRole("button", { name: "Why this recipe?" }));

  expect(await screen.findByText("It matches your Indian cuisine preference.")).toBeInTheDocument();
});

test("shows a friendly error when the explanation is unavailable", async () => {
  getRecommendationExplanation.mockResolvedValue({ data: null, error: "AI explanations are unavailable right now. Please try again later." });
  renderCard({ showRecommendationExplanation: true });

  userEvent.click(screen.getByRole("button", { name: "Why this recipe?" }));

  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("AI explanations are unavailable right now"));
});
