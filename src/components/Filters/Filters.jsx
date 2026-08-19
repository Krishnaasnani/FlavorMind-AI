import PropTypes from "prop-types";
import { SEARCH_CONFIG } from "../../constants";
import styles from "./Filters.module.css";

function Filters({ filters, onChange, onClear }) {
  const activeFilters = [
    ["cuisine", filters.cuisine, "Area"],
    ["category", filters.category, "Category"],
    ["dietary", filters.dietary, "Food type"],
    ["ingredient", filters.ingredient, "Ingredient"]
  ].filter(([, value]) => value);

  return (
    <details className={styles.filters} open>
      <summary className={styles.summary}>Filters <span>Refine your search</span></summary>
      <div className={styles.controls}>
        <label className={styles.selectLabel}><span>Area / cuisine</span><select value={filters.cuisine || ""} onChange={(event) => onChange({ ...filters, cuisine: event.target.value })}>{SEARCH_CONFIG.CUISINES.map((cuisine) => <option key={cuisine || "all"} value={cuisine}>{cuisine || "All areas"}</option>)}</select></label>
        <label className={styles.selectLabel}><span>Category</span><select value={filters.category || ""} onChange={(event) => onChange({ ...filters, category: event.target.value })}>{SEARCH_CONFIG.CATEGORIES.map((category) => <option key={category || "all"} value={category}>{category || "All categories"}</option>)}</select></label>
        <label className={styles.selectLabel}><span>Food type</span><select value={filters.dietary || ""} onChange={(event) => onChange({ ...filters, dietary: event.target.value })}>{SEARCH_CONFIG.DIETARY.map((dietary) => <option key={dietary || "all"} value={dietary}>{dietary || "Any food type"}</option>)}</select></label>
        <label className={styles.selectLabel}><span>Main ingredient</span><input value={filters.ingredient || ""} onChange={(event) => onChange({ ...filters, ingredient: event.target.value })} placeholder="e.g. paneer, rice" /></label>
        <button className={styles.clear} type="button" onClick={onClear} disabled={!activeFilters.length}>Clear filters</button>
      </div>
      {activeFilters.length > 0 && <div className={styles.activeFilters} aria-label="Active filters">{activeFilters.map(([key, value, label]) => <button key={key} type="button" onClick={() => onChange({ ...filters, [key]: "" })}>{label}: {value} <span aria-hidden="true">×</span></button>)}</div>}
    </details>
  );
}

export default Filters;

Filters.propTypes = {
  filters: PropTypes.shape({
    cuisine: PropTypes.string.isRequired,
    category: PropTypes.string,
    ingredient: PropTypes.string,
    dietary: PropTypes.string
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired
};
