import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./features/auth/context/AuthContext";
import { useAuth } from "./features/auth/hooks/useAuth";
import { ThemeProvider } from "./store/ThemeContext";
import { ToastProvider } from "./hooks/ToastProvider";
import { I18nProvider } from "./i18n/I18nContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { router } from "./router";
import { queryClient } from "./lib/queryClient";
import "./styles/global.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Élément racine introuvable");

const InnerApp: React.FC = () => {
  const { isAuthenticated, loading, user } = useAuth();
  return (
    <ErrorBoundary>
      <RouterProvider
        router={router}
        context={{
          auth: { isAuthenticated, loading, role: user?.role ?? null },
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
