import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider } from "@/contexts/ToastProvider";
import { I18nProvider } from "@/contexts/I18nContext";
import { ErrorBoundary } from "@/components/ui/common/ErrorBoundary";
import type { UserRole } from "@/enums";
import { router } from "@/router";
import { queryClient } from "@/configs/queryClient";
import "@fontsource-variable/bricolage-grotesque/opsz.css";
import "@fontsource-variable/plus-jakarta-sans";
import "./styles/global.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

const InnerApp: React.FC = () => {
  const { isAuthenticated, loading, user } = useAuth();
  return (
    <ErrorBoundary>
      <RouterProvider
        router={router}
        context={{
          auth: {
            isAuthenticated,
            loading,
            role: (user?.role as UserRole) ?? null,
          },
        }}
      />
    </ErrorBoundary>
  );
};

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>
          <ThemeProvider>
            <ToastProvider>
              <InnerApp />
            </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
