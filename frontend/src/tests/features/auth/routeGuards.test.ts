import { describe, expect, it } from "vitest";
import { UserRole } from "@/enums";
import {
  evaluateAdminGuard,
  evaluateAuthGuard,
  evaluateGuestGuard,
} from "@/features/auth/routeGuards";

describe("evaluateAuthGuard", () => {
  it("returns loading while auth is loading", () => {
    expect(
      evaluateAuthGuard({ isAuthenticated: false, loading: true }),
    ).toEqual({ status: "loading" });
  });

  it("redirects to /login when not authenticated", () => {
    expect(
      evaluateAuthGuard({ isAuthenticated: false, loading: false }),
    ).toEqual({ status: "redirect", to: "/login" });
  });

  it("returns ok when authenticated", () => {
    expect(
      evaluateAuthGuard({ isAuthenticated: true, loading: false }),
    ).toEqual({ status: "ok" });
  });
});

describe("evaluateAdminGuard", () => {
  it("returns loading while auth is loading, regardless of role", () => {
    expect(evaluateAdminGuard({ loading: true, role: null })).toEqual({
      status: "loading",
    });
  });

  it("redirects to / when role is not Admin", () => {
    expect(
      evaluateAdminGuard({ loading: false, role: UserRole.Developer }),
    ).toEqual({ status: "redirect", to: "/" });
  });

  it("returns ok when role is Admin", () => {
    expect(
      evaluateAdminGuard({ loading: false, role: UserRole.Admin }),
    ).toEqual({ status: "ok" });
  });
});

describe("evaluateGuestGuard", () => {
  it("returns loading while auth is loading", () => {
    expect(
      evaluateGuestGuard({ isAuthenticated: true, loading: true }),
    ).toEqual({ status: "loading" });
  });

  it("redirects to / when already authenticated", () => {
    expect(
      evaluateGuestGuard({ isAuthenticated: true, loading: false }),
    ).toEqual({ status: "redirect", to: "/" });
  });

  it("returns ok when not authenticated", () => {
    expect(
      evaluateGuestGuard({ isAuthenticated: false, loading: false }),
    ).toEqual({ status: "ok" });
  });
});
