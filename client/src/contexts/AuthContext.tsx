import type React from "react";
import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { refreshAccessToken } from "@/configs/apiClient";
import {
  endSession,
  hasPersistedSession,
  startSession,
} from "@/configs/session";
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
  refreshUser: () => void;
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
  refreshUser: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { setLanguage } = useI18n();
  const queryClient = useQueryClient();
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
    if (!hasPersistedSession()) {
      setLoading(false);
      return;
    }

    refreshAccessToken(null)
      .then(() =>
        runMe(
          {},
          {
            onSuccess: applyUser,
            onError: endSession,
            onSettled: () => setLoading(false),
          },
        ),
      )
      .catch(() => {
        endSession();
        setLoading(false);
      });
  }, [runMe, applyUser]);

  const refreshUser = useCallback(
    () => runMe({}, { onSuccess: applyUser }),
    [runMe, applyUser],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await runLogin({ data: { email, password } });
      startSession(response.accessToken ?? "");
      applyUser(response.user);
      return response.user;
    },
    [runLogin, applyUser],
  );

  const logout = useCallback(async () => {
    try {
      await runLogout({});
    } finally {
      endSession();
      queryClient.clear();
      setUser(null);
    }
  }, [runLogout, queryClient]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      loading,
      login,
      logout,
      setUser,
      refreshUser,
    }),
    [user, loading, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
