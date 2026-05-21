import React from "react";
import { AppRoutes } from "./routes";
import { ErrorBoundary } from "./components/ErrorBoundary";

export const App: React.FC = () => (
  <ErrorBoundary>
    <AppRoutes />
  </ErrorBoundary>
);
