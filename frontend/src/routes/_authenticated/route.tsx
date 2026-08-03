import { createFileRoute, Navigate, redirect } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { evaluateAuthGuard } from "@/features/auth/routeGuards";
import { FullScreenLoader } from "@/components/ui/common/FullScreenLoader";
import { AppLayout } from "@/components/layout/AppLayout";
import { useRealtimeSync } from "@/domains/realtime/hooks";

const RouteComponent = () => {
  const { isAuthenticated, loading } = useAuth();
  useRealtimeSync();
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
