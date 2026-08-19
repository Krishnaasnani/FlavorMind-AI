import { Link } from "react-router-dom";
import styles from "./NotFound.module.css";

function NotFound() {
  return <section className={styles.page}><p className={styles.emoji} aria-hidden="true">🥘</p><p className={styles.code}>404</p><h1>Recipe not found</h1><p>That page has gone off the menu, but there are plenty more delicious ideas waiting.</p><Link to="/">← Back to home</Link></section>;
}

export default NotFound;
