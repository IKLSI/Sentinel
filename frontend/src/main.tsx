import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./features/auth/context/AuthContext";
import { ThemeProvider } from "./store/ThemeContext";
import { ToastProvider } from "./hooks/ToastProvider";
import { I18nProvider } from "./i18n/I18nContext";
import { App } from "./App";
import { queryClient } from "./lib/queryClient";
import "./styles/global.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Élément racine introuvable");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <I18nProvider>
          <AuthProvider>
            <ThemeProvider>
              <ToastProvider>
                <App />
              </ToastProvider>
            </ThemeProvider>
          </AuthProvider>
        </I18nProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
