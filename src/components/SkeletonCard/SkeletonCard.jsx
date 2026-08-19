import styles from "./SkeletonCard.module.css";

function SkeletonCard() {
  return <div className={styles.card} aria-label="Loading recipe" role="status"><div className={styles.image} /><div className={styles.line} /><div className={`${styles.line} ${styles.title}`} /><div className={`${styles.line} ${styles.short}`} /><div className={styles.buttons}><span /><span /></div></div>;
}

export default SkeletonCard;
