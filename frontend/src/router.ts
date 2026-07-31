import { createRouter } from "@tanstack/react-router";
import { routeTree } from "@/routeTree.gen";
import type { RouterContext } from "@/routerContext";

export const router = createRouter({
  routeTree,
  context: {
    auth: { isAuthenticated: false, loading: true, role: null },
  } satisfies RouterContext,
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
