import RecipeCard from "../components/RecipeCard/RecipeCard";
import { useFavoritesContext } from "../context/FavoritesContext";
import styles from "./Favorites.module.css";

function Favorites() {
  const { favorites } = useFavoritesContext();
  return <section className={styles.page}><header><p>YOUR COOKBOOK</p><h1>Favourite recipes</h1><span>{favorites.length} saved recipe{favorites.length === 1 ? "" : "s"}</span></header>{favorites.length === 0 ? <div className={styles.empty}><span aria-hidden="true">🍳</span><h2>Your cookbook is empty</h2><p>Save recipes you’d like to make later and they’ll live here.</p></div> : <div className={styles.grid}>{favorites.map((recipe) => <RecipeCard key={recipe.id || recipe.idMeal} recipe={recipe} />)}</div>}</section>;
}

export default Favorites;
