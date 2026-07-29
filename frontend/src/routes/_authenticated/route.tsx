import { createFileRoute, Navigate, redirect } from "@tanstack/react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { evaluateAuthGuard } from "@/features/auth/routeGuards";
import { FullScreenLoader } from "@/components/FullScreenLoader";
import { AppLayout } from "@/layouts/AppLayout";

const RouteComponent = () => {
  const { isAuthenticated, loading } = useAuth();
  const result = evaluateAuthGuard({ isAuthenticated, loading });
  if (result.status === "loading") return <FullScreenLoader />;
  if (result.status === "redirect") return <Navigate to={result.to} replace />;
  return <AppLayout />;
};

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ context }) => {
    const result = evaluateAuthGuard(context.auth);
    if (result.status === "redirect") throw redirect({ to: result.to });
  },
  component: RouteComponent,
});
