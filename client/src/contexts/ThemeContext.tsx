import type React from "react";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { ThemeProvider as MuiThemeProvider, CssBaseline } from "@mui/material";
import { darkTheme, lightTheme } from "@/configs/themes";
import { useUpdatePreferencesMutation } from "@/domains/users/mutations";
import { useAuth } from "@/hooks/useAuth";
import { Theme } from "@/enums";
import { STORAGE_KEYS } from "@/constants/storage";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: Theme.Light,
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isAuthenticated } = useAuth();
  const updatePreferencesMutation = useUpdatePreferencesMutation();
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem(STORAGE_KEYS.THEME) as Theme) || Theme.Light;
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  useEffect(() => {
    if (user?.theme) setTheme(user.theme as Theme);
  }, [user]);

  const updatePreferences = updatePreferencesMutation.mutate;
  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === Theme.Dark ? Theme.Light : Theme.Dark;
      if (isAuthenticated) updatePreferences({ data: { theme: next } });
      return next;
    });
  }, [isAuthenticated, updatePreferences]);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme === Theme.Dark ? darkTheme : lightTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
