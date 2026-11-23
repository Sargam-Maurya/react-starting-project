import { createContext, useContext, useState } from "react";
import { STORAGE_KEYS } from "../constants";
import { getItem, setItem, removeItem } from "../utils/storage";
import * as authService from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getItem(STORAGE_KEYS.SESSION));

  async function login(email, password) {
    const result = await authService.login(email, password);
    setSession(result);
    setItem(STORAGE_KEYS.SESSION, result);
    return result;
  }

  async function register(details) {
    const result = await authService.register(details);
    setSession(result);
    setItem(STORAGE_KEYS.SESSION, result);
    return result;
  }

  function logout() {
    setSession(null);
    removeItem(STORAGE_KEYS.SESSION);
  }

  const value = {
    user: session?.user ?? null,
    isAuthenticated: Boolean(session?.token),
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
