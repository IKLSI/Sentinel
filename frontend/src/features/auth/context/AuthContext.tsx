import React, { createContext, useState, useEffect, useCallback } from "react";
import { User } from "../../../types";
import {
  login as apiLogin,
  logout as apiLogout,
  me as apiMe,
} from "../api/auth";
import { useI18n } from "../../../i18n/I18nContext";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  loading: true,
  login: async () => {
    throw new Error();
  },
  logout: async () => {},
  setUser: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { setLanguage } = useI18n();

  const syncLanguage = useCallback(
    (u: User) => {
      if (u.language) setLanguage(u.language);
    },
    [setLanguage],
  );

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      apiMe()
        .then((u) => {
          setUser(u);
          syncLanguage(u);
        })
        .catch(() => {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [syncLanguage]);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await apiLogin(email, password);
      localStorage.setItem("accessToken", response.accessToken);
      localStorage.setItem("refreshToken", response.refreshToken);
      setUser(response.user);
      syncLanguage(response.user);
      return response.user;
    },
    [syncLanguage],
  );

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, loading, login, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
