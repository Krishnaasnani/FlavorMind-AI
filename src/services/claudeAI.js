import { API_CONFIG, RECIPE_DEFAULTS } from "../constants";

function getTextContent(content = []) {
  return content
    .filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("\n")
    .trim();
}

function normaliseHistory(chatHistory = []) {
  return chatHistory
    .filter((message) => message?.content && (message.role === "user" || message.role === "assistant"))
    .map(({ role, content }) => ({ role, content }));
}

function toInsightList(text) {
  return text
    .split("\n")
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 3);
}

async function sendAIMessage(messages, system) {
  try {
    const response = await fetch(API_CONFIG.AI_PROXY_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        system,
        messages
      })
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: null,
        error: payload?.error?.message || "The AI assistant could not answer right now. Please try again."
      };
    }

    return {
      data: {
        ...payload,
        text: getTextContent(payload?.content)
      },
      error: null
    };
  } catch (requestError) {
    return {
      data: null,
      error: requestError.message || "A network error occurred while contacting the AI assistant."
    };
  }
}

/** Sends an ongoing recipe conversation to the server-side AI assistant. */
export function askChef(userMessage, chatHistory = []) {
  const cleanMessage = userMessage?.trim();

  if (!cleanMessage) {
    return Promise.resolve({ data: null, error: "Please enter a question for the chef." });
  }

  return sendAIMessage(
    [...normaliseHistory(chatHistory), { role: "user", content: cleanMessage }],
    "You are a warm, practical chef assistant for the RecipeFinder AI app. Give safe, concise cooking advice. Ask a short clarification question when essential."
  );
}

/** Returns practical ingredient substitutions for a specific recipe. */
export function getSubstitutes(ingredient, recipeName = RECIPE_DEFAULTS.RECIPE_NAME) {
  const cleanIngredient = ingredient?.trim();

  if (!cleanIngredient) {
    return Promise.resolve({ data: null, error: "Choose an ingredient before asking for substitutes." });
  }

  return sendAIMessage(
    [{ role: "user", content: `Give 3 practical substitutes for ${cleanIngredient} in ${recipeName}. Mention any important quantity or flavour adjustment. Use short bullet points.` }],
    "You are a precise cooking substitution assistant. Prioritise accessible, food-safe alternatives."
  );
}

/** Returns exactly three short, ingredient-aware health observations. */
export async function getNutritionalInsight(recipeName, ingredients = []) {
  const ingredientText = Array.isArray(ingredients)
    ? ingredients.map((ingredient) => ingredient.name || ingredient.original || ingredient).join(", ")
    : String(ingredients);
  const result = await sendAIMessage(
    [{ role: "user", content: `For ${recipeName || RECIPE_DEFAULTS.RECIPE_NAME}, based on these ingredients: ${ingredientText || "not supplied"}. Give exactly 3 concise, balanced health observations. Do not diagnose or make medical claims. Use bullet points only.` }],
    "You are a nutrition-aware cooking assistant. Your information is educational, balanced, and not medical advice."
  );

  if (result.error) {
    return result;
  }

  return {
    data: {
      ...result.data,
      insights: toInsightList(result.data.text)
    },
    error: null
  };
}

const RECOMMENDATION_EXPLANATION_ERROR = "AI explanations are unavailable right now. Please try again later.";
const INTERNAL_RECOMMENDATION_LANGUAGE = /\b(?:score|points?|criteria|signals?|ranking|evaluation|breakdown|matching calculations?)\b/i;

function fallbackRecommendationExplanation(context) {
  const matches = [];
  const matchedSignals = context.matchedPreferenceSignals || {};

  if (matchedSignals.area === true && context.area) matches.push(`${context.area} cuisine`);
  if (matchedSignals.category === true && context.category) matches.push(`${context.category} recipes`);
  if (Array.isArray(matchedSignals.preferredIngredients)) matches.push(...matchedSignals.preferredIngredients.filter(Boolean));

  if (matches.length > 0) {
    return `This recipe matches your interest in ${matches.join(", ")}. It could be a useful choice when you want something aligned with those preferences.`;
  }

  const style = [context.area && `${context.area}-style`, context.category].filter(Boolean).join(" ");
  return style
    ? `This ${style} recipe is a nice opportunity to explore something beyond your usual preferences. It may be worth trying when you want a different recipe idea.`
    : "This recipe is a nice opportunity to explore something beyond your usual preferences. It may be worth trying when you want a different recipe idea.";
}

/** Explains an existing recommendation without asking the AI to choose the recipe. */
export async function getRecommendationExplanation(recipe, recommendationContext = {}) {
  const context = {
    recipeName: recipe?.title || recipe?.strMeal || RECIPE_DEFAULTS.RECIPE_NAME,
    category: recipe?.category || recipe?.strCategory || "",
    area: recipe?.cuisine || recipe?.cuisines?.[0] || recipe?.strArea || "",
    matchedPreferenceSignals: recommendationContext.matches || recipe?.recommendationMatches || {},
    recommendationScore: recommendationContext.score ?? recipe?.recommendationScore ?? recipe?.score ?? 0,
    recommendationReasons: recommendationContext.breakdown || recipe?.recommendationBreakdown || {}
  };

  const result = await sendAIMessage(
    [{ role: "user", content: `Using only this structured recommendation context, write a natural, user-facing explanation in 2–3 concise sentences for why this recipe may be a good choice. Mention actual matching preferences when they exist. If none match, explain that it may be useful for exploring a different cuisine or category, or describe its provided recipe metadata without pretending there is a match. Never mention or expose the recommendation score, points, criteria, signals, ranking, evaluation, breakdown, or matching calculations. Do not generate or replace the recommendation, and do not invent nutrition, health benefits, cooking time, ingredients, or dietary properties. Return plain text only.\n\n${JSON.stringify(context)}` }],
    "You explain transparent recipe recommendations. Be concise, grounded only in the supplied context, and use 2–3 sentences."
  );

  if (result.error || !result.data?.text) return { data: null, error: RECOMMENDATION_EXPLANATION_ERROR };
  const explanation = result.data.text.trim();
  return {
    data: { explanation: INTERNAL_RECOMMENDATION_LANGUAGE.test(explanation) ? fallbackRecommendationExplanation(context) : explanation },
    error: null
  };
}
