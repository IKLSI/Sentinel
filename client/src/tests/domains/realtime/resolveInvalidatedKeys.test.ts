import { describe, expect, it } from "vitest";
import { DASHBOARD_QUERY_KEY } from "@/domains/dashboard/constants";
import {
  AVAILABLE_REPOS_QUERY_KEY,
  PROJECT_DETAIL_QUERY_KEY,
  PROJECTS_QUERY_KEY,
} from "@/domains/projects/constants";
import { resolveInvalidatedKeys } from "@/domains/realtime/constants";
import { REALTIME_RESOURCES } from "@/domains/realtime/contract.gen";
import { TICKETS_QUERY_KEY, ticketQueryKey } from "@/domains/tickets/constants";

describe("resolveInvalidatedKeys", () => {
  it("should refresh the ticket without reloading project summaries on ticket activity", () => {
    const keys = resolveInvalidatedKeys({
      resource: REALTIME_RESOURCES.TicketActivity,
      id: "42",
    });

    expect(keys).toEqual([
      [TICKETS_QUERY_KEY],
      DASHBOARD_QUERY_KEY,
      ticketQueryKey("42"),
    ]);
    expect(keys).not.toContainEqual(PROJECTS_QUERY_KEY);
  });

  it("should refresh project details when a ticket changes", () => {
    const keys = resolveInvalidatedKeys({
      resource: REALTIME_RESOURCES.Ticket,
      id: "42",
    });

    expect(keys).toContainEqual(PROJECT_DETAIL_QUERY_KEY);
    expect(keys).toContainEqual(ticketQueryKey("42"));
  });

  it("should refresh importable repositories when projects or integrations change", () => {
    expect(
      resolveInvalidatedKeys({ resource: REALTIME_RESOURCES.Projects }),
    ).toContainEqual(AVAILABLE_REPOS_QUERY_KEY);
    expect(
      resolveInvalidatedKeys({ resource: REALTIME_RESOURCES.Integrations }),
    ).toContainEqual(AVAILABLE_REPOS_QUERY_KEY);
  });

  it("should refresh tickets and dashboard when users change", () => {
    const keys = resolveInvalidatedKeys({ resource: REALTIME_RESOURCES.Users });

    expect(keys).toContainEqual([TICKETS_QUERY_KEY]);
    expect(keys).toContainEqual(DASHBOARD_QUERY_KEY);
  });
});
