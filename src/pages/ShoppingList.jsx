import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useMealPlannerContext } from "../context/MealPlannerContext";
import { STORAGE_KEYS } from "../constants";
import styles from "./ShoppingList.module.css";

function mealPlanRecipes(plan) { return Object.values(plan).flatMap((day) => Object.values(day).filter(Boolean)); }
function quantityValue(quantity) {
  const value = Number(quantity);
  return Number.isInteger(value) && value > 0 ? value : 1;
}

function readShoppingList() {
  try {
    const storedItems = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.SHOPPING_LIST) || "[]");
    return Array.isArray(storedItems) ? storedItems.map((item) => ({ ...item, quantity: quantityValue(item.quantity) })) : [];
  } catch {
    return [];
  }
}

export function ingredientsFrom(recipes) {
  const merged = [];
  recipes.flatMap((recipe) => recipe.extendedIngredients || []).forEach((ingredient) => {
    const name = String(ingredient.nameClean || ingredient.name || ingredient.original || "Ingredient").trim();
    const nameKey = name.toLowerCase();
    const amount = ingredient.amount ?? "";
    const unit = String(ingredient.unit || "").trim();
    const unitKey = unit.toLowerCase();
    const numericAmount = amount !== "" && Number.isFinite(Number(amount));
    const current = merged.find((item) => item.nameKey === nameKey && item.unitKey === unitKey && item.numericAmount && numericAmount);

    if (current) {
      current.amount = Math.round((Number(current.amount) + Number(amount)) * 100) / 100;
      return;
    }

    const sourceId = ingredient.id ? `-${ingredient.id}` : `-${merged.length}`;
    merged.push({
      id: numericAmount ? `generated-${nameKey}-${unitKey}` : `generated-${nameKey}-${unitKey}${sourceId}`,
      name,
      nameKey,
      amount,
      unit,
      unitKey,
      numericAmount,
      quantity: 1,
      checked: false,
      source: "generated"
    });
  });
  return merged.map(({ nameKey, unitKey, numericAmount, ...item }) => item);
}

function sameIngredient(item, generatedItem) {
  return item.id === generatedItem.id || (
    item.source === "generated" &&
    String(item.name || "").trim().toLowerCase() === generatedItem.name.toLowerCase() &&
    String(item.unit || "").trim().toLowerCase() === generatedItem.unit.toLowerCase()
  );
}

function ShoppingList() {
  const { plan } = useMealPlannerContext();
  const generatedItems = useMemo(() => ingredientsFrom(mealPlanRecipes(plan)), [plan]);
  const [items, setItems] = useState(readShoppingList);
  const [manualItem, setManualItem] = useState("");
  const [itemError, setItemError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  useEffect(() => { setItems((current) => {
    const manualItems = current.filter((item) => item.source === "manual" || item.id?.startsWith("manual-"));
    const refreshedGeneratedItems = generatedItems.map((item) => {
      const previous = current.find((existing) => sameIngredient(existing, item));
      return { ...item, quantity: quantityValue(previous?.quantity), checked: Boolean(previous?.checked) };
    });
    return [...refreshedGeneratedItems, ...manualItems];
  }); }, [generatedItems]);
  useEffect(() => { window.localStorage.setItem(STORAGE_KEYS.SHOPPING_LIST, JSON.stringify(items)); }, [items]);
  const addManualItem = useCallback((event) => {
    event.preventDefault();
    const name = manualItem.trim();
    if (!name) return;

    if (items.some((item) => String(item.name || "").trim().toLowerCase() === name.toLowerCase())) {
      setItemError(`${name} is already in your shopping list.`);
      return;
    }

    setItems((current) => [...current, { id: `manual-${Date.now()}`, name, amount: "", unit: "", quantity: 1, checked: false, source: "manual" }]);
    setManualItem("");
    setItemError("");
  }, [items, manualItem]);
  const toggleItem = useCallback((id) => setItems((current) => current.map((item) => item.id === id ? { ...item, checked: !item.checked } : item)), []);
  const changeQuantity = useCallback((id, change) => setItems((current) => current.map((item) => item.id === id ? { ...item, quantity: Math.max(1, quantityValue(item.quantity) + change) } : item)), []);
  const clearList = useCallback(() => { setItems([]); setItemError(""); setExportError(""); }, []);
  const exportList = useCallback(async () => { const text = items.map((item) => `${item.checked ? "[x]" : "[ ]"} ${quantityValue(item.quantity) > 1 ? `${quantityValue(item.quantity)} × ` : ""}${item.amount} ${item.unit} ${item.name}`.replace(/\s+/g, " ")).join("\n"); setExporting(true); setExportError(""); try { await navigator.clipboard.writeText(text); toast.success("Shopping list copied"); } catch { const message = "Copying is unavailable in this browser."; setExportError(message); toast.error(message); } finally { setExporting(false); } }, [items]);
  return <section className={styles.page}><header><p>GROCERY DAY</p><h1>Shopping list</h1><span>{items.length} item{items.length === 1 ? "" : "s"} to pick up</span></header>{items.length === 0 ? <div className={styles.empty}><span aria-hidden="true">🛒</span><h2>Your list is empty</h2><p>Add recipes with ingredient details to your meal plan to generate a list.</p></div> : <ul className={styles.list}>{items.map((item) => <li key={item.id}><label className={item.checked ? styles.checked : ""}><input type="checkbox" checked={item.checked} onChange={() => toggleItem(item.id)} /><span className={styles.checkbox} aria-hidden="true">✓</span><span className={styles.itemText}><strong>{item.name}</strong>{(item.amount || item.unit) && <small>{item.amount} {item.unit}</small>}</span></label><div className={styles.quantityControls} aria-label={`${item.name} quantity`}><button type="button" onClick={() => changeQuantity(item.id, -1)} disabled={quantityValue(item.quantity) <= 1} aria-label={`Decrease quantity of ${item.name}`}>−</button><output aria-label={`Quantity of ${item.name}`}>{quantityValue(item.quantity)}</output><button type="button" onClick={() => changeQuantity(item.id, 1)} aria-label={`Increase quantity of ${item.name}`}>+</button></div></li>)}</ul>}<form className={styles.manualForm} onSubmit={addManualItem}><label><span>Add an item</span><input value={manualItem} onChange={(event) => { setManualItem(event.target.value); setItemError(""); }} placeholder="e.g. olive oil" /></label><button type="submit">Add</button></form>{itemError && <p className={styles.error} role="alert">{itemError}</p>}{exportError && <p className={styles.error} role="alert">{exportError}</p>}<div className={styles.actions}><button className={styles.export} type="button" onClick={exportList} disabled={exporting || items.length === 0}>{exporting ? "Copying…" : "Export as text"}</button><button className={styles.clear} type="button" onClick={clearList} disabled={items.length === 0}>Clear list</button></div></section>;
}

export default ShoppingList;
