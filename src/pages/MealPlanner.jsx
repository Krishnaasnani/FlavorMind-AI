import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useFavoritesContext } from "../context/FavoritesContext";
import { useMealPlannerContext } from "../context/MealPlannerContext";
import { APP_ROUTES, MEAL_DAYS, MEAL_TYPES } from "../constants";
import { getRecipeId, getRecipeTitle } from "../utils/helpers";
import styles from "./MealPlanner.module.css";

function MealPlanner() {
  const { favorites } = useFavoritesContext();
  const { plan, addToPlan, removeFromPlan } = useMealPlannerContext();
  const navigate = useNavigate();
  const onDragEnd = useCallback((result) => {
    if (!result.destination || result.source.droppableId !== "recipe-sidebar") return;
    const recipe = favorites.find((item) => String(getRecipeId(item)) === result.draggableId);
    const [day, mealType] = result.destination.droppableId.split("-");
    if (recipe && MEAL_DAYS.includes(day) && MEAL_TYPES.includes(mealType) && !addToPlan(day, mealType, recipe)) toast.error("That meal slot is already occupied. Remove it before adding another.");
  }, [addToPlan, favorites]);
  const goToShoppingList = useCallback(() => navigate(APP_ROUTES.SHOPPING_LIST), [navigate]);
  const removeRecipeFromPlan = useCallback((day, mealType) => removeFromPlan(day, mealType), [removeFromPlan]);
  return (
    <section className={styles.page}><header className={styles.header}><p>PLAN AHEAD</p><h1>Weekly meal planner</h1><span>Drag a saved recipe into any meal slot.</span></header>
      <DragDropContext onDragEnd={onDragEnd}><div className={styles.layout}><aside className={styles.sidebar}><h2>Saved recipes</h2><Droppable droppableId="recipe-sidebar" isDropDisabled>{(provided) => <div className={styles.recipeList} ref={provided.innerRef} {...provided.droppableProps}>{favorites.length ? favorites.map((recipe, index) => <Draggable key={getRecipeId(recipe)} draggableId={String(getRecipeId(recipe))} index={index}>{(dragProvided) => <div className={styles.draggable} ref={dragProvided.innerRef} {...dragProvided.draggableProps} {...dragProvided.dragHandleProps}><span aria-hidden="true">⠿</span>{getRecipeTitle(recipe)}</div>}</Draggable>) : <p className={styles.sidebarEmpty}>Save recipes from Home to add them here.</p>}{provided.placeholder}</div>}</Droppable></aside>
      <div className={styles.days}>{MEAL_DAYS.map((day) => <section className={styles.day} key={day}><h2>{day}</h2><div className={styles.slots}>{MEAL_TYPES.map((mealType) => <Droppable key={mealType} droppableId={`${day}-${mealType}`}>{(provided, snapshot) => <div className={`${styles.slot} ${snapshot.isDraggingOver ? styles.draggingOver : ""}`} ref={provided.innerRef} {...provided.droppableProps}><strong>{mealType}</strong>{plan[day][mealType] ? <p className={styles.plannedRecipe}><span>{getRecipeTitle(plan[day][mealType])}</span><button type="button" onClick={() => removeRecipeFromPlan(day, mealType)} aria-label={`Remove ${getRecipeTitle(plan[day][mealType])}`}>×</button></p> : <p className={styles.dropHint}>Drop a recipe here</p>}{provided.placeholder}</div>}</Droppable>)}</div></section>)}</div></div></DragDropContext>
      <button className={styles.generate} type="button" onClick={goToShoppingList}>Generate Shopping List <span aria-hidden="true">→</span></button>
    </section>
  );
}

export default MealPlanner;
