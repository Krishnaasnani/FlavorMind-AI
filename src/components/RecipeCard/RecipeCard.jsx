import { Link } from "react-router-dom";
import { useCallback, useState } from "react";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import { useFavoritesContext } from "../../context/FavoritesContext";
import { useMealPlannerContext } from "../../context/MealPlannerContext";
import { getNutritionalInsight, getRecommendationExplanation } from "../../services/claudeAI";
import { getRecipeById } from "../../services/theMealDB";
import { MEAL_TYPES, RECIPE_DEFAULTS, UI_TEXT } from "../../constants";
import styles from "./RecipeCard.module.css";

function findNextSlot(plan) {
  for (const [day, meals] of Object.entries(plan)) {
    for (const mealType of MEAL_TYPES) if (!meals[mealType]) return { day, mealType };
  }
  return null;
}

function RecipeCard({ recipe, showAIInsight = false, showRecommendationExplanation = false }) {
  const { addFavorite, removeFavorite, isFavorite } = useFavoritesContext();
  const { addToPlan, plan } = useMealPlannerContext();
  const [insight, setInsight] = useState([]);
  const [insightError, setInsightError] = useState("");
  const [insightEmpty, setInsightEmpty] = useState("");
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [recommendationExplanation, setRecommendationExplanation] = useState("");
  const [recommendationExplanationError, setRecommendationExplanationError] = useState("");
  const [loadingRecommendationExplanation, setLoadingRecommendationExplanation] = useState(false);
  const [addingToPlan, setAddingToPlan] = useState(false);
  const [plannerError, setPlannerError] = useState("");
  const saved = isFavorite(recipe);
  const category = recipe.category || "Recipe";
  const area = recipe.cuisines?.[0] || recipe.cuisine || RECIPE_DEFAULTS.CUISINE;

  const toggleFavorite = useCallback(() => {
    if (saved) {
      removeFavorite(recipe);
      toast("Removed from favorites");
    } else {
      addFavorite(recipe);
      toast.success("Saved to favorites");
    }
  }, [addFavorite, recipe, removeFavorite, saved]);

  const addRecipeToPlan = useCallback(async () => {
    setAddingToPlan(true); setPlannerError("");
    let recipeForPlan = recipe;
    if (!recipe.extendedIngredients?.length) {
      const result = await getRecipeById(recipe.id);
      if (result.error) { setPlannerError(result.error); toast.error(result.error); setAddingToPlan(false); return; }
      recipeForPlan = result.data;
    }
    const slot = findNextSlot(plan);
    if (!slot) {
      const message = "Your meal plan is full. Remove a planned meal before adding another.";
      setPlannerError(message); toast.error(message); setAddingToPlan(false); return;
    }
    if (!addToPlan(slot.day, slot.mealType, recipeForPlan)) {
      const message = "That meal slot is already occupied. Choose another slot.";
      setPlannerError(message); toast.error(message); setAddingToPlan(false); return;
    }
    toast.success(`Added to ${slot.day} ${slot.mealType}`);
    setAddingToPlan(false);
  }, [addToPlan, plan, recipe]);

  const loadInsight = useCallback(async () => {
    setLoadingInsight(true); setInsightError(""); setInsightEmpty("");
    const result = await getNutritionalInsight(recipe.title, recipe.extendedIngredients || []);
    setLoadingInsight(false);
    if (result.error) {
      setInsightError(result.error);
      return;
    }

    const nextInsight = result.data?.insights || [];
    setInsight(nextInsight);
    if (nextInsight.length === 0) setInsightEmpty(UI_TEXT.NO_AI_INSIGHT);
  }, [recipe.extendedIngredients, recipe.title]);

  const explainRecommendation = useCallback(async () => {
    setLoadingRecommendationExplanation(true);
    setRecommendationExplanationError("");
    setRecommendationExplanation("");
    const result = await getRecommendationExplanation(recipe);
    setLoadingRecommendationExplanation(false);
    if (result.error) {
      setRecommendationExplanationError(result.error);
      return;
    }
    setRecommendationExplanation(result.data?.explanation || "");
  }, [recipe]);

  return (
    <article className={styles.card}>
      <div className={styles.imageWrap}><img src={recipe.image} alt={recipe.title} /><button className={`${styles.favorite} ${saved ? styles.saved : ""}`} type="button" onClick={toggleFavorite} aria-label={saved ? `Remove ${recipe.title} from favorites` : `Save ${recipe.title} to favorites`}>{saved ? "♥" : "♡"}</button></div>
      <div className={styles.content}>
        <p className={styles.cuisine}>{category}</p>
        <h2><Link to={`/recipe/${recipe.id}`}>{recipe.title}</Link></h2>
        <p className={styles.stats}><span>🌍 {area}</span>{recipe.extendedIngredients?.length > 0 && <span>🍽 {recipe.extendedIngredients.length} ingredients</span>}</p>
        <div className={styles.actions}><button className={styles.planButton} type="button" onClick={addRecipeToPlan} disabled={addingToPlan}>{addingToPlan ? "Adding…" : "Add to plan"}</button>
        {showAIInsight && <button className={styles.aiButton} type="button" onClick={loadInsight} disabled={loadingInsight}>{loadingInsight ? "Thinking…" : "AI insight"}</button>}
        {showRecommendationExplanation && <button className={styles.aiButton} type="button" onClick={explainRecommendation} disabled={loadingRecommendationExplanation}>{loadingRecommendationExplanation ? "Explaining…" : "Why this recipe?"}</button>}</div>
        {insight.length > 0 && <ul className={styles.insights}>{insight.map((item) => <li key={item}>{item}</li>)}</ul>}
        {insightError && <p className={styles.error} role="alert">{insightError}</p>}
        {insightEmpty && <p className={styles.emptyInsight}>{insightEmpty}</p>}
        {recommendationExplanation && <p className={styles.explanation}>{recommendationExplanation}</p>}
        {recommendationExplanationError && <p className={styles.error} role="alert">{recommendationExplanationError}</p>}
        {plannerError && <p className={styles.error} role="alert">{plannerError}</p>}
      </div>
    </article>
  );
}

export default RecipeCard;

RecipeCard.propTypes = {
  recipe: PropTypes.object.isRequired,
  showAIInsight: PropTypes.bool,
  showRecommendationExplanation: PropTypes.bool
};
