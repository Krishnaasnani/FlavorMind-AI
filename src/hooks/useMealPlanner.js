import { useCallback, useEffect, useRef, useState } from "react";
import { MEAL_DAYS, MEAL_TYPES, STORAGE_KEYS } from "../constants";

function createEmptyPlan() {
  return MEAL_DAYS.reduce((plan, day) => {
    plan[day] = MEAL_TYPES.reduce((meals, mealType) => ({ ...meals, [mealType]: null }), {});
    return plan;
  }, {});
}

function readPlan() {
  try {
    const storedPlan = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.MEAL_PLAN) || "null");
    const emptyPlan = createEmptyPlan();

    return MEAL_DAYS.reduce((plan, day) => {
      plan[day] = { ...emptyPlan[day], ...(storedPlan?.[day] || {}) };
      return plan;
    }, {});
  } catch {
    return createEmptyPlan();
  }
}

/** Persistent Monday–Sunday breakfast, lunch, and dinner recipe plan. */
export default function useMealPlanner() {
  const [plan, setPlan] = useState(readPlan);
  const planRef = useRef(plan);

  useEffect(() => {
    planRef.current = plan;
    window.localStorage.setItem(STORAGE_KEYS.MEAL_PLAN, JSON.stringify(plan));
  }, [plan]);

  const addToPlan = useCallback((day, mealType, recipe) => {
    const currentPlan = planRef.current;
    if (!MEAL_DAYS.includes(day) || !MEAL_TYPES.includes(mealType) || !recipe || currentPlan[day]?.[mealType]) return false;

    const nextPlan = {
      ...currentPlan,
      [day]: { ...currentPlan[day], [mealType]: recipe }
    };

    planRef.current = nextPlan;
    setPlan(nextPlan);
    return true;
  }, []);

  const removeFromPlan = useCallback((day, mealType) => {
    if (!MEAL_DAYS.includes(day) || !MEAL_TYPES.includes(mealType)) return;

    const nextPlan = {
      ...planRef.current,
      [day]: { ...planRef.current[day], [mealType]: null }
    };

    planRef.current = nextPlan;
    setPlan(nextPlan);
  }, []);

  const clearPlan = useCallback(() => {
    const emptyPlan = createEmptyPlan();
    planRef.current = emptyPlan;
    setPlan(emptyPlan);
  }, []);

  return { plan, addToPlan, removeFromPlan, clearPlan };
}
