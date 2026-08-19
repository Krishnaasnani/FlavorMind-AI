import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getNutritionalInsight, getSubstitutes } from "../services/claudeAI";
import { getRecipeById, getRecipeNutrition } from "../services/theMealDB";
import { APP_ROUTES, RECIPE_DEFAULTS, UI_TEXT } from "../constants";
import styles from "./RecipeDetail.module.css";

function scaleAmount(amount, multiplier) {
  const number = Number.parseFloat(amount);
  return Number.isFinite(number) ? Math.round(number * multiplier * 100) / 100 : amount;
}

function RecipeDetail() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [nutrition, setNutrition] = useState(null);
  const [nutritionError, setNutritionError] = useState("");
  const [servings, setServings] = useState(1);
  const [checkedIngredients, setCheckedIngredients] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [substitutionOpen, setSubstitutionOpen] = useState(false);
  const [ingredient, setIngredient] = useState("");
  const [substitutes, setSubstitutes] = useState([]);
  const [insights, setInsights] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [substitutesEmpty, setSubstitutesEmpty] = useState("");
  const [insightsEmpty, setInsightsEmpty] = useState("");

  useEffect(() => {
    let active = true;
    async function loadRecipe() {
      setLoading(true); setError(""); setNutritionError(""); setRecipe(null); setNutrition(null);
      const [recipeResult, nutritionResult] = await Promise.all([getRecipeById(id), getRecipeNutrition(id)]);
      if (!active) return;
      if (recipeResult.error) setError(recipeResult.error); else { setRecipe(recipeResult.data); setServings(recipeResult.data.servings || 1); setIngredient(recipeResult.data.extendedIngredients?.[0]?.name || ""); }
      if (nutritionResult.error) setNutritionError(nutritionResult.error); else if (nutritionResult.data) setNutrition(nutritionResult.data);
      setLoading(false);
    }
    loadRecipe();
    return () => { active = false; };
  }, [id]);

  const multiplier = recipe ? servings / recipe.servings : 1;
  const steps = useMemo(() => recipe?.analyzedInstructions?.[0]?.steps || [], [recipe]);
  const loadSubstitutes = useCallback(async () => {
    setAiLoading(true); setSubstitutes([]); setAiError(""); setSubstitutesEmpty("");
    const result = await getSubstitutes(ingredient, recipe.title);
    setAiLoading(false);
    if (result.error) {
      setAiError(result.error);
      return;
    }

    const nextSubstitutes = result.data?.text?.split("\n").filter(Boolean) || [];
    setSubstitutes(nextSubstitutes);
    if (nextSubstitutes.length === 0) setSubstitutesEmpty("No substitutions are available for that ingredient right now.");
  }, [ingredient, recipe?.title]);
  const loadInsights = useCallback(async () => {
    setAiLoading(true); setInsights([]); setAiError(""); setInsightsEmpty("");
    const result = await getNutritionalInsight(recipe.title, recipe.extendedIngredients);
    setAiLoading(false);
    if (result.error) {
      setAiError(result.error);
      return;
    }

    const nextInsights = result.data?.insights || [];
    setInsights(nextInsights);
    if (nextInsights.length === 0) setInsightsEmpty(UI_TEXT.NO_HEALTH_INSIGHT);
  }, [recipe?.extendedIngredients, recipe?.title]);
  const toggleIngredient = useCallback((ingredientKey) => {
    setCheckedIngredients((current) => ({ ...current, [ingredientKey]: !current[ingredientKey] }));
  }, []);

  if (loading) return <p className={styles.loading}>Loading recipe…</p>;
  if (error && !recipe) return <section className={styles.loadError}><p role="alert">{error}</p><Link to="/">Back to home</Link></section>;
  if (!recipe) return null;
  return (
    <article className={styles.page}>
      <Link className={styles.back} to={APP_ROUTES.HOME}>← Back to recipes</Link>
      <header className={styles.hero}><img src={recipe.image} alt={recipe.title} /><div className={styles.heroCopy}><p className={styles.cuisines}>{recipe.cuisines?.length ? recipe.cuisines.map((cuisine) => <span key={cuisine}>{cuisine}</span>) : <span>{RECIPE_DEFAULTS.CUISINE} cuisine</span>}</p><h1>{recipe.title}</h1><p className={styles.meta}><span>⏱ {recipe.readyInMinutes || "—"} min</span><span>Serves {recipe.servings || "—"}</span></p></div></header>
      <div className={styles.layout}><div className={styles.content}>
        <section className={styles.ingredients}><div className={styles.sectionHeading}><div><p>SHOP & PREP</p><h2>Ingredients</h2></div><label className={styles.servings}>Servings <strong>{servings}</strong><input type="range" min="1" max="12" value={servings} onChange={(event) => setServings(Number(event.target.value))} /></label></div><ul>{recipe.extendedIngredients?.map((item) => { const ingredientKey = item.id || item.original; return <li key={ingredientKey}><label className={checkedIngredients[ingredientKey] ? styles.checkedIngredient : ""}><input type="checkbox" checked={Boolean(checkedIngredients[ingredientKey])} onChange={() => toggleIngredient(ingredientKey)} /><span className={styles.checkbox} aria-hidden="true">✓</span>{scaleAmount(item.amount, multiplier)} {item.unit} {item.name}</label></li>; })}</ul><button className={styles.substituteButton} type="button" onClick={() => setSubstitutionOpen(true)}>Can’t find an ingredient?</button></section>
        <section className={styles.method}><div><p>COOKING GUIDE</p><h2>Method</h2></div>{steps.length ? <ol>{steps.map((step) => <li key={step.number}><span>{step.number}</span>{step.step}</li>)}</ol> : <p className={styles.noInstructions}>{recipe.instructions?.replace(/<[^>]*>/g, "") || "Instructions are not available."}</p>}</section>
      </div><aside className={styles.sidebar}><section className={styles.nutrition}><p>NUTRITION FACTS</p><h2>Per serving</h2>{nutritionError ? <p className={styles.nutritionError} role="alert">{nutritionError}</p> : nutrition ? <div><span><strong>{nutrition.calories || "—"}</strong>calories</span><span><strong>{nutrition.protein || "—"}</strong>protein</span><span><strong>{nutrition.fat || "—"}</strong>fat</span><span><strong>{nutrition.carbs || "—"}</strong>carbs</span></div> : <p className={styles.aiEmpty}>Nutrition details are not available for this recipe.</p>}</section><section className={styles.health}><h2>Feel-good food</h2><p>Get a quick health summary from your AI kitchen assistant.</p><button type="button" onClick={loadInsights} disabled={aiLoading}>{aiLoading ? "Loading…" : "Health Benefits"}</button>{insights.length > 0 && <ul>{insights.map((insight) => <li key={insight}>{insight}</li>)}</ul>}{insightsEmpty && <p className={styles.aiEmpty}>{insightsEmpty}</p>}</section></aside></div>
      {aiError && <p className={styles.error} role="alert">{aiError}</p>}
      {substitutionOpen && <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Ingredient substitutions"><div className={styles.modalContent}><button className={styles.modalClose} type="button" onClick={() => setSubstitutionOpen(false)} aria-label="Close">×</button><p>AI KITCHEN HELPER</p><h2>Find a substitute</h2><label>Ingredient<input value={ingredient} onChange={(event) => setIngredient(event.target.value)} /></label><button className={styles.askAi} type="button" onClick={loadSubstitutes} disabled={aiLoading}>{aiLoading ? "Finding…" : "Ask AI"}</button><ul>{substitutes.map((item) => <li key={item}>{item}</li>)}</ul>{substitutesEmpty && <p className={styles.aiEmpty}>{substitutesEmpty}</p>}{aiError && <p className={styles.error} role="alert">{aiError}</p>}</div></div>}
    </article>
  );
}

export default RecipeDetail;
