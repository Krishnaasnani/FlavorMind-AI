import { fireEvent, render, screen } from "@testing-library/react";
import Filters from "./Filters";

const filters = { cuisine: "Indian", category: "Vegetarian", dietary: "", ingredient: "paneer" };

test("renders data-backed filter controls and active filters", () => {
  render(<Filters filters={filters} onChange={jest.fn()} onClear={jest.fn()} />);

  expect(screen.getByLabelText("Area / cuisine")).toHaveValue("Indian");
  expect(screen.getByLabelText("Category")).toHaveValue("Vegetarian");
  expect(screen.getByLabelText("Main ingredient")).toHaveValue("paneer");
  expect(screen.getByRole("button", { name: /area: indian/i })).toBeInTheDocument();
});

test("clear filters delegates to the parent without changing layout", () => {
  const onClear = jest.fn();
  render(<Filters filters={filters} onChange={jest.fn()} onClear={onClear} />);

  fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));

  expect(onClear).toHaveBeenCalledTimes(1);
});
