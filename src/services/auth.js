const authRequest = async (path, options = {}) => {
  const response = await fetch(path, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error?.message || "We could not complete that request.");
  return payload;
};

export function getCurrentUser() {
  return authRequest("/api/auth/me", { method: "GET" });
}

export function signUpAccount({ name, email, password, remember = false }) {
  return authRequest("/api/auth/signup", { method: "POST", body: JSON.stringify({ name, email, password, remember }) });
}

export function signInAccount({ email, password, remember = false }) {
  return authRequest("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password, remember }) });
}

export function signOutAccount() {
  return authRequest("/api/auth/logout", { method: "POST", body: JSON.stringify({}) });
}
