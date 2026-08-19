import { useCallback, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useThemeContext } from "../../context/ThemeContext";
import { APP_ROUTES } from "../../constants";
import { useAuth } from "../../context/AuthContext";
import styles from "./Navbar.module.css";

const navigationLinks = [
  { to: APP_ROUTES.HOME, label: "Home" },
  { to: APP_ROUTES.FAVORITES, label: "Favorites" },
  { to: APP_ROUTES.MEAL_PLANNER, label: "Meal Planner" },
  { to: APP_ROUTES.SHOPPING_LIST, label: "Shopping List" }
];

function Navbar() {
  const { theme, toggleTheme } = useThemeContext();
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const toggleMenu = useCallback(() => setMenuOpen((open) => !open), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const toggleAccount = useCallback(() => setAccountOpen((open) => !open), []);
  const closeAccount = useCallback(() => setAccountOpen(false), []);
  const handleLogout = useCallback(async () => {
    setLogoutPending(true);
    setLogoutError("");
    try {
      await signOut();
      closeAccount();
      navigate(APP_ROUTES.HOME);
    } catch (_error) {
      setLogoutError("We could not sign you out. Please try again.");
    } finally {
      setLogoutPending(false);
    }
  }, [closeAccount, navigate, signOut]);

  return (
    <header className={styles.header}>
      <nav className={styles.nav} aria-label="Main navigation">
        <NavLink className={styles.brand} to="/" aria-label="RecipeFinder AI home">🍽️ <span>RecipeFinder AI</span></NavLink>
        <button className={styles.menuButton} type="button" onClick={toggleMenu} aria-expanded={menuOpen} aria-controls="primary-navigation"><span aria-hidden="true">☰</span><span className={styles.menuLabel}>Menu</span></button>
        <div id="primary-navigation" className={`${styles.links} ${menuOpen ? styles.open : ""}`}>
          {navigationLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === APP_ROUTES.HOME} onClick={closeMenu}>
              {link.label}
            </NavLink>
          ))}
        </div>
        <button className={styles.themeButton} type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
        {!authLoading && (user ? <div className={styles.account}>
          <button className={styles.accountButton} type="button" onClick={toggleAccount} aria-expanded={accountOpen} aria-haspopup="menu">
            <span className={styles.avatar} aria-hidden="true">{user.name.charAt(0).toUpperCase()}</span><span className={styles.accountName}>{user.name}</span><span aria-hidden="true">⌄</span>
          </button>
          {accountOpen && <div className={styles.accountMenu} role="menu">
            <Link to={APP_ROUTES.ACCOUNT} onClick={closeAccount} role="menuitem">Profile</Link>
            <button type="button" onClick={handleLogout} disabled={logoutPending} role="menuitem">{logoutPending ? "Signing out…" : "Sign out"}</button>
            {logoutError && <p className={styles.accountError} role="alert">{logoutError}</p>}
          </div>}
        </div> : <Link className={styles.loginLink} to={APP_ROUTES.LOGIN}>Sign in</Link>)}
      </nav>
    </header>
  );
}

export default Navbar;
