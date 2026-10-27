import type { FC } from "react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { DEMO_PATHS } from "@/features/landing/demo/constants";
import { DemoShell } from "@/features/landing/demo/components/DemoShell";
import { DemoDashboard } from "@/features/landing/demo/components/DemoDashboard";
import { DemoProject } from "@/features/landing/demo/components/DemoProject";
import { DemoTickets } from "@/features/landing/demo/components/DemoTickets";

const rootRoute = createRootRoute({ component: DemoShell });

const pageRoute = (path: string, component: FC) =>
  createRoute({ getParentRoute: () => rootRoute, path, component });

const routeTree = rootRoute.addChildren([
  pageRoute(DEMO_PATHS.dashboard, DemoDashboard),
  pageRoute(DEMO_PATHS.projects, DemoProject),
  pageRoute(DEMO_PATHS.project, DemoProject),
  pageRoute(DEMO_PATHS.tickets, DemoTickets),
  pageRoute(DEMO_PATHS.ticket, DemoTickets),
]);

export const createDemoRouter = (initialPath: string = DEMO_PATHS.dashboard) =>
  createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
    defaultNotFoundComponent: DemoDashboard,
    scrollRestoration: () => false,
  });

export type DemoRouter = ReturnType<typeof createDemoRouter>;
