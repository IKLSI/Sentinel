import {
  createFileRoute,
  Navigate,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { evaluateAdminGuard } from "@/features/auth/routeGuards";
import type { UserRole } from "@/enums";

const RouteComponent = () => {
  const { user } = useAuth();
  const result = evaluateAdminGuard({
    loading: false,
    role: (user?.role as UserRole) ?? null,
  });
  if (result.status === "redirect") return <Navigate to={result.to} replace />;
  return <Outlet />;
};

export const Route = createFileRoute("/_authenticated/_admin")({
  beforeLoad: ({ context }) => {
    const result = evaluateAdminGuard(context.auth);
    if (result.status === "redirect") throw redirect({ to: result.to });
  },
  component: RouteComponent,
});
