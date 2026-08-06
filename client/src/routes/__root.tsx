import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import type { RouterContext } from "@/routerContext";
import { ErrorPage } from "@/pages/ErrorPage";

const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import("@tanstack/react-query-devtools").then((m) => ({
        default: m.ReactQueryDevtools,
      })),
    )
  : () => null;

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <>
      <Outlet />
      {import.meta.env.DEV && (
        <Suspense fallback={null}>
          <ReactQueryDevtools buttonPosition="bottom-right" />
        </Suspense>
      )}
    </>
  ),
  notFoundComponent: () => <ErrorPage status={404} />,
});
