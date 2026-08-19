import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { STORAGE_KEYS } from "../constants";
import { MealPlannerProvider } from "../context/MealPlannerContext";
import ShoppingList, { ingredientsFrom } from "./ShoppingList";

function renderShoppingList() {
  return render(<MealPlannerProvider><ShoppingList /></MealPlannerProvider>);
}

beforeEach(() => {
  window.localStorage.clear();
});

test("does not add a duplicate manual item", () => {
  renderShoppingList();
  const input = screen.getByPlaceholderText("e.g. olive oil");

  userEvent.type(input, "Milk");
  userEvent.click(screen.getByRole("button", { name: "Add" }));
  userEvent.type(input, " milk ");
  userEvent.click(screen.getByRole("button", { name: "Add" }));

  expect(screen.getAllByText("Milk")).toHaveLength(1);
  expect(screen.getByRole("alert")).toHaveTextContent("milk is already in your shopping list.");
});

test("increments and decrements item quantity with a minimum of one", () => {
  renderShoppingList();
  const input = screen.getByPlaceholderText("e.g. olive oil");
  userEvent.type(input, "Milk");
  userEvent.click(screen.getByRole("button", { name: "Add" }));

  const quantity = () => screen.getByLabelText("Quantity of Milk");
  const decrease = screen.getByRole("button", { name: "Decrease quantity of Milk" });
  userEvent.click(screen.getByRole("button", { name: "Increase quantity of Milk" }));
  expect(quantity()).toHaveTextContent("2");
  userEvent.click(decrease);
  userEvent.click(decrease);
  expect(quantity()).toHaveTextContent("1");
  expect(decrease).toBeDisabled();
});

test("merges numeric ingredients only when their units match", () => {
  const result = ingredientsFrom([{
    extendedIngredients: [
      { id: "a", name: "Milk", amount: 1, unit: "cup" },
      { id: "b", name: "milk", amount: 2, unit: "cup" },
      { id: "c", name: "Milk", amount: 500, unit: "ml" }
    ]
  }]);

  expect(result).toEqual([
    expect.objectContaining({ name: "Milk", amount: 3, unit: "cup" }),
    expect.objectContaining({ name: "Milk", amount: 500, unit: "ml" })
  ]);
});

test("persists manual item quantities in localStorage", () => {
  const { unmount } = renderShoppingList();
  const input = screen.getByPlaceholderText("e.g. olive oil");
  userEvent.type(input, "Milk");
  userEvent.click(screen.getByRole("button", { name: "Add" }));
  userEvent.click(screen.getByRole("button", { name: "Increase quantity of Milk" }));
  unmount();

  renderShoppingList();

  expect(screen.getByLabelText("Quantity of Milk")).toHaveTextContent("2");
  expect(JSON.parse(window.localStorage.getItem(STORAGE_KEYS.SHOPPING_LIST))).toEqual([
    expect.objectContaining({ name: "Milk", quantity: 2, source: "manual" })
  ]);
});
