import PropTypes from "prop-types";
import styles from "./SearchBar.module.css";

function SearchBar({ value, onChange }) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>Search recipes</span>
      <div className={styles.inputWrap}>
        <span className={styles.icon} aria-hidden="true">⌕</span>
        <input className={styles.input} value={value} onChange={(event) => onChange(event.target.value)} placeholder="Try pasta, paneer, or chicken" />
        {value && <button className={styles.clear} type="button" onClick={() => onChange("")} aria-label="Clear search">×</button>}
      </div>
    </label>
  );
}

export default SearchBar;

SearchBar.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
};
