import { UserRole } from "@/enums";
import type { RouterContext } from "@/routerContext";

type AuthState = RouterContext["auth"];

type GuardResult<TRedirect extends string> =
  | { status: "loading" }
  | { status: "redirect"; to: TRedirect }
  | { status: "ok" };

export function evaluateAuthGuard(
  auth: Pick<AuthState, "isAuthenticated" | "loading">,
): GuardResult<"/login"> {
  if (auth.loading) return { status: "loading" };
  if (!auth.isAuthenticated) return { status: "redirect", to: "/login" };
  return { status: "ok" };
}

export function evaluateAdminGuard(
  auth: Pick<AuthState, "loading" | "role">,
): GuardResult<"/dashboard"> {
  if (auth.loading) return { status: "loading" };
  if (auth.role !== UserRole.Admin)
    return { status: "redirect", to: "/dashboard" };
  return { status: "ok" };
}

export function evaluateGuestGuard(
  auth: Pick<AuthState, "isAuthenticated" | "loading">,
): GuardResult<"/dashboard"> {
  if (auth.loading) return { status: "loading" };
  if (auth.isAuthenticated) return { status: "redirect", to: "/dashboard" };
  return { status: "ok" };
}
