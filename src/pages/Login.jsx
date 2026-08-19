import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../constants";
import { useAuth } from "../context/AuthContext";
import styles from "./Auth.module.css";

function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "", remember: true });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!form.email.trim() || !form.password) return setError("Enter your email and password to continue.");
    setSubmitting(true);
    try {
      await signIn({ ...form, email: form.email.trim() });
      const from = location.state?.from;
      navigate(from ? `${from.pathname}${from.search || ""}${from.hash || ""}` : APP_ROUTES.HOME, { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return <section className={styles.page} aria-labelledby="login-title"><div className={styles.card}>
    <p className={styles.eyebrow}>WELCOME BACK</p><h1 id="login-title">Sign in to your kitchen.</h1><p className={styles.intro}>Save recipes, plan your week, and keep your list close.</p>
    <form className={styles.form} onSubmit={submit} noValidate>
      <div className={styles.field}><label htmlFor="login-email">Email</label><input id="login-email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="email" required /></div>
      <div className={styles.field}><label htmlFor="login-password">Password</label><input id="login-password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete="current-password" required /></div>
      <label className={styles.remember}><input type="checkbox" checked={form.remember} onChange={(event) => setForm({ ...form, remember: event.target.checked })} /> Keep me signed in</label>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button className={styles.submit} type="submit" disabled={submitting}>{submitting ? "Signing in…" : "Sign in"}</button>
    </form>
    <p className={styles.switch}>New here? <Link to={APP_ROUTES.SIGNUP}>Create an account</Link></p>
  </div></section>;
}

export default Login;
