import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../constants";
import { useAuth } from "../context/AuthContext";
import styles from "./Auth.module.css";

function SignUp() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", remember: true });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (form.name.trim().length < 2) return setError("Enter your name to create your account.");
    if (!form.email.trim() || form.password.length < 8) return setError("Use a valid email and a password of at least 8 characters.");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match.");
    setSubmitting(true);
    try { await signUp({ ...form, email: form.email.trim() }); navigate(APP_ROUTES.HOME, { replace: true }); }
    catch (requestError) { setError(requestError.message); }
    finally { setSubmitting(false); }
  };

  return <section className={styles.page} aria-labelledby="signup-title"><div className={styles.card}>
    <p className={styles.eyebrow}>MAKE IT YOURS</p><h1 id="signup-title">Create your kitchen account.</h1><p className={styles.intro}>Your recipes and plans stay ready for the week ahead.</p>
    <form className={styles.form} onSubmit={submit} noValidate>
      <div className={styles.field}><label htmlFor="signup-name">Name</label><input id="signup-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} autoComplete="name" required /></div>
      <div className={styles.field}><label htmlFor="signup-email">Email</label><input id="signup-email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="email" required /></div>
      <div className={styles.field}><label htmlFor="signup-password">Password</label><input id="signup-password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete="new-password" required /></div>
      <div className={styles.field}><label htmlFor="signup-confirm">Confirm password</label><input id="signup-confirm" type="password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} autoComplete="new-password" required /></div>
      <label className={styles.remember}><input type="checkbox" checked={form.remember} onChange={(event) => setForm({ ...form, remember: event.target.checked })} /> Keep me signed in</label>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button className={styles.submit} type="submit" disabled={submitting}>{submitting ? "Creating account…" : "Create account"}</button>
    </form>
    <p className={styles.switch}>Already have an account? <Link to={APP_ROUTES.LOGIN}>Sign in</Link></p>
  </div></section>;
}

export default SignUp;
