import type React from "react";
import { useState } from "react";
import Box from "@mui/material/Box";
import { ThemeProvider } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthContext } from "@/contexts/AuthContext";
import { DEMO_LIGHT_VARIABLES, demoTheme } from "@/features/landing/demo/theme";

const ANONYMOUS_VISITOR: React.ContextType<typeof AuthContext> = {
  user: null,
  isAuthenticated: false,
  loading: false,
  login: () => Promise.reject(new Error("Connexion indisponible dans la démo")),
  logout: () => Promise.resolve(),
  setUser: () => {},
  refreshUser: () => {},
};

const createOfflineQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { enabled: false, retry: false },
      mutations: { retry: false },
    },
  });

interface Props {
  children: React.ReactNode;
}

export const DemoScope: React.FC<Props> = ({ children }) => {
  const [queryClient] = useState(createOfflineQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={ANONYMOUS_VISITOR}>
        <ThemeProvider theme={demoTheme}>
          <Box
            sx={{
              ...DEMO_LIGHT_VARIABLES,
              colorScheme: "light",
              color: "var(--text)",
              fontFamily: "var(--font-ui)",
              textAlign: "left",
            }}
          >
            {children}
          </Box>
        </ThemeProvider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
};
