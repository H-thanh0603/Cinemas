"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { demoUser } from "@/data";
import type { UserProfile } from "@/types";

const STORAGE_KEY = "tz_auth";

interface AuthContextValue {
  user: UserProfile | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, password: string) => boolean;
  logout: () => void;
  hydrated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          isLoggedIn: boolean;
          user: UserProfile | null;
        };
        setIsLoggedIn(!!parsed.isLoggedIn);
        setUser(parsed.user);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ isLoggedIn, user })
    );
  }, [isLoggedIn, user, hydrated]);

  const login = useCallback((email: string, password: string) => {
    if (!email.trim() || !password.trim()) return false;
    setUser({ ...demoUser, email: email.trim() });
    setIsLoggedIn(true);
    return true;
  }, []);

  const register = useCallback(
    (name: string, email: string, password: string) => {
      if (!name.trim() || !email.trim() || !password.trim()) return false;
      setUser({
        ...demoUser,
        name: name.trim(),
        email: email.trim(),
      });
      setIsLoggedIn(true);
      return true;
    },
    []
  );

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoggedIn, login, register, logout, hydrated }),
    [user, isLoggedIn, login, register, logout, hydrated]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
