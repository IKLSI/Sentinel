import type React from "react";
import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { STORAGE_KEYS } from "@/constants/storage";
import { useI18n } from "@/contexts/I18nContext";
import {
  useLoginMutation,
  useLogoutMutation,
  useMeMutation,
} from "@/domains/auth/mutations";
import type { AuthUser } from "@/domains/auth/types";
import { Language } from "@/enums";

const SUPPORTED_LANGUAGES: string[] = Object.values(Language);

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser) => void;
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { setLanguage } = useI18n();
  const meMutation = useMeMutation();
  const loginMutation = useLoginMutation();
  const logoutMutation = useLogoutMutation();
  const runMe = meMutation.mutate;
  const runLogin = loginMutation.mutateAsync;
  const runLogout = logoutMutation.mutateAsync;

  const applyUser = useCallback(
    (profile: AuthUser) => {
      setUser(profile);
      if (SUPPORTED_LANGUAGES.includes(profile.language))
        setLanguage(profile.language as Language);
    },
    [setLanguage],
  );

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) {
      setLoading(false);
      return;
    }

    runMe(
      {},
      {
        onSuccess: applyUser,
        onError: () => localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
        onSettled: () => setLoading(false),
      },
    );
  }, [runMe, applyUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await runLogin({ data: { email, password } });
      localStorage.setItem(
        STORAGE_KEYS.ACCESS_TOKEN,
        response.accessToken ?? "",
      );
      applyUser(response.user);
      return response.user;
    },
    [runLogin, applyUser],
  );

  const logout = useCallback(async () => {
    try {
      await runLogout({});
    } finally {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      setUser(null);
    }
  }, [runLogout]);

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, loading, login, logout, setUser }),
    [user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
