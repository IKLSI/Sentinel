import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { FullScreenLoader } from "@/components/ui/common/feedback/FullScreenLoader";
import { LandingPage } from "@/features/landing/pages/LandingPage";
import { ROUTES } from "@/constants/routes";

const RouteComponent = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (isAuthenticated) return <Navigate to={ROUTES.DASHBOARD} replace />;
  return <LandingPage />;
};

export const Route = createFileRoute("/")({
  component: RouteComponent,
});
