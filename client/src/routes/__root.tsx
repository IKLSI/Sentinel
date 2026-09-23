import {
  createRootRouteWithContext,
  Outlet,
  useLocation,
} from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import type { RouterContext } from "@/routerContext";
import { ErrorPage } from "@/pages/ErrorPage";
import { useI18n } from "@/contexts/I18nContext";
import { ROUTES } from "@/constants/routes";
import { FullScreenLoader } from "@/components/ui/common/FullScreenLoader";

const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import("@tanstack/react-query-devtools").then((m) => ({
        default: m.ReactQueryDevtools,
      })),
    )
  : () => null;

const RootComponent = () => {
  const { ready } = useI18n();
  const pathname = useLocation({ select: (location) => location.pathname });

  if (!ready && pathname !== ROUTES.HOME) return <FullScreenLoader />;

  return (
    <>
      <Outlet />
      {import.meta.env.DEV && (
        <Suspense fallback={null}>
          <ReactQueryDevtools buttonPosition="bottom-right" />
        </Suspense>
      )}
    </>
  );
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  notFoundComponent: () => <ErrorPage status={404} />,
});
