import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../constants";
import { useAuth } from "../context/AuthContext";
import styles from "./Account.module.css";

function Account() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const logout = async () => {
    setPending(true);
    setError("");
    try { await signOut(); navigate(APP_ROUTES.HOME, { replace: true }); }
    catch (_error) { setError("We could not sign you out. Please try again."); }
    finally { setPending(false); }
  };
  return <section className={styles.page} aria-labelledby="account-title"><div className={styles.card}>
    <p className={styles.eyebrow}>YOUR PROFILE</p><h1 id="account-title">{user?.name || "Your account"}</h1><p className={styles.email}>{user?.email}</p>
    <div className={styles.links}><Link to={APP_ROUTES.FAVORITES}>Favorites</Link><Link to={APP_ROUTES.MEAL_PLANNER}>Meal Planner</Link><Link to={APP_ROUTES.SHOPPING_LIST}>Shopping List</Link></div>
    {error && <p role="alert" className={styles.error}>{error}</p>}<button className={styles.logout} type="button" onClick={logout} disabled={pending}>{pending ? "Signing out…" : "Sign out"}</button>
  </div></section>;
}

export default Account;
