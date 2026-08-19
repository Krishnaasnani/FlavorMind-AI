import { createContext, useContext, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { getCurrentUser, signInAccount, signOutAccount, signUpAccount } from "../services/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then(({ user: currentUser }) => { if (active) setUser(currentUser || null); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    async signUp(details) {
      const result = await signUpAccount(details);
      setUser(result.user || null);
      return result.user;
    },
    async signIn(details) {
      const result = await signInAccount(details);
      setUser(result.user || null);
      return result.user;
    },
    async signOut() {
      await signOutAccount();
      setUser(null);
    }
  }), [loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider.");
  return context;
}

AuthProvider.propTypes = { children: PropTypes.node.isRequired };
