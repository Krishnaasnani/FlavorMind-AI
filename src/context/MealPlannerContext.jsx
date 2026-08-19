import { createContext, useContext } from "react";
import PropTypes from "prop-types";
import useMealPlanner from "../hooks/useMealPlanner";

const MealPlannerContext = createContext(null);

export function MealPlannerProvider({ children }) {
  const mealPlannerState = useMealPlanner();

  return <MealPlannerContext.Provider value={mealPlannerState}>{children}</MealPlannerContext.Provider>;
}

export function useMealPlannerContext() {
  const context = useContext(MealPlannerContext);

  if (!context) {
    throw new Error("useMealPlannerContext must be used within a MealPlannerProvider.");
  }

  return context;
}

export default MealPlannerContext;

MealPlannerProvider.propTypes = {
  children: PropTypes.node.isRequired
};
