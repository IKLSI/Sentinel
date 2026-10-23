import { describe, expect, it } from "vitest";
import { DASHBOARD_QUERY_KEY } from "@/domains/dashboard/constants";
import { projectKeys } from "@/domains/projects/constants";
import { resolveInvalidatedKeys } from "@/domains/realtime/constants";
import { REALTIME_RESOURCES } from "@/domains/realtime/contract.gen";
import { ticketKeys } from "@/domains/tickets/constants";

describe("resolveInvalidatedKeys", () => {
  it("should refresh the ticket without reloading project summaries on ticket activity", () => {
    const keys = resolveInvalidatedKeys({
      resource: REALTIME_RESOURCES.TicketActivity,
      id: "42",
    });

    expect(keys).toEqual([
      ticketKeys.lists(),
      DASHBOARD_QUERY_KEY,
      ticketKeys.detail("42"),
    ]);
    expect(keys).not.toContainEqual(projectKeys.list());
  });

  it("should refresh every project detail when a ticket change has no project scope", () => {
    const keys = resolveInvalidatedKeys({
      resource: REALTIME_RESOURCES.Ticket,
      id: "42",
    });

    expect(keys).toContainEqual(projectKeys.details());
    expect(keys).toContainEqual(ticketKeys.detail("42"));
  });

  it("should refresh only the affected project details when the ticket change is scoped", () => {
    const keys = resolveInvalidatedKeys({
      resource: REALTIME_RESOURCES.Ticket,
      id: "42",
      projectIds: ["p-1", "p-2"],
    });

    expect(keys).toContainEqual(projectKeys.detail("p-1"));
    expect(keys).toContainEqual(projectKeys.detail("p-2"));
    expect(keys).not.toContainEqual(projectKeys.details());
  });

  it("should refresh no project detail when a ticket is created without project", () => {
    const keys = resolveInvalidatedKeys({
      resource: REALTIME_RESOURCES.Tickets,
      projectIds: [],
    });

    expect(keys).not.toContainEqual(projectKeys.details());
    expect(keys).toContainEqual(projectKeys.list());
  });

  it("should refresh project details when projects change", () => {
    expect(
      resolveInvalidatedKeys({ resource: REALTIME_RESOURCES.Projects }),
    ).toContainEqual(projectKeys.details());
  });

  it("should refresh importable repositories when projects or integrations change", () => {
    expect(
      resolveInvalidatedKeys({ resource: REALTIME_RESOURCES.Projects }),
    ).toContainEqual(projectKeys.availableRepos());
    expect(
      resolveInvalidatedKeys({ resource: REALTIME_RESOURCES.Integrations }),
    ).toContainEqual(projectKeys.availableRepos());
  });

  it("should refresh tickets and dashboard when users change", () => {
    const keys = resolveInvalidatedKeys({ resource: REALTIME_RESOURCES.Users });

    expect(keys).toContainEqual(ticketKeys.lists());
    expect(keys).toContainEqual(DASHBOARD_QUERY_KEY);
  });
});
