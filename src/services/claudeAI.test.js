import { getRecommendationExplanation } from "./claudeAI";

beforeEach(() => {
  global.fetch = jest.fn();
});

test("sends only structured recommendation context to the backend", async () => {
  global.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ content: [{ type: "text", text: "It matches your preferences." }] })
  });

  const result = await getRecommendationExplanation({
    title: "Chicken Rice",
    category: "Main",
    cuisine: "Indian",
    extendedIngredients: [{ name: "chicken" }],
    recommendationScore: 5,
    recommendationMatches: { area: true },
    recommendationBreakdown: { area: 3 }
  });

  const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
  expect(result.data.explanation).toBe("It matches your preferences.");
  expect(requestBody.messages[0].content).toContain('"recipeName":"Chicken Rice"');
  expect(requestBody.messages[0].content).toContain('"recommendationScore":5');
  expect(requestBody.messages[0].content).toContain("Never mention or expose the recommendation score");
  expect(requestBody.messages[0].content).not.toContain("extendedIngredients");
});

test("does not expose internal recommendation language in the user-facing explanation", async () => {
  global.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ content: [{ type: "text", text: "This recipe has a score of 5 points based on criteria and ranking signals." }] })
  });

  const result = await getRecommendationExplanation({
    title: "Chicken Rice",
    category: "Main",
    cuisine: "Indian",
    recommendationMatches: { area: true, category: false, preferredIngredients: ["chicken"] },
    recommendationScore: 5,
    recommendationBreakdown: { area: 3, preferredIngredients: 2 }
  });

  expect(result.error).toBeNull();
  expect(result.data.explanation).toContain("Indian cuisine");
  expect(result.data.explanation).not.toMatch(/score|points?|criteria|signals?|ranking|evaluation|breakdown/i);
});

test("normalizes backend failures to a friendly explanation error", async () => {
  global.fetch.mockResolvedValue({
    ok: false,
    json: async () => ({ error: { message: "credit balance is too low" } })
  });

  const result = await getRecommendationExplanation({ title: "Chicken Rice" });

  expect(result).toEqual({ data: null, error: "AI explanations are unavailable right now. Please try again later." });
});
