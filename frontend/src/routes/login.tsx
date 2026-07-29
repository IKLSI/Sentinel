import { createFileRoute, Navigate, redirect } from "@tanstack/react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { evaluateGuestGuard } from "@/features/auth/routeGuards";
import { FullScreenLoader } from "@/components/FullScreenLoader";
import { LoginPage } from "@/features/auth/pages/LoginPage";

const RouteComponent = () => {
  const { isAuthenticated, loading } = useAuth();
  const result = evaluateGuestGuard({ isAuthenticated, loading });
  if (result.status === "loading") return <FullScreenLoader />;
  if (result.status === "redirect") return <Navigate to={result.to} replace />;
  return <LoginPage />;
};

export const Route = createFileRoute("/login")({
  beforeLoad: ({ context }) => {
    const result = evaluateGuestGuard(context.auth);
    if (result.status === "redirect") throw redirect({ to: result.to });
  },
  component: RouteComponent,
});
