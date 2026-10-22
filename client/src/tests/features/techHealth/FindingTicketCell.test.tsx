import { beforeEach, describe, expect, it, vi } from "vitest";
import { FindingKind } from "@/enums";
import { FindingTicketCell } from "@/features/techHealth/pages/ProjectDetailPage/components/FindingTicketCell";
import { FindingActionsProvider } from "@/features/techHealth/pages/ProjectDetailPage/findingActions";
import { render, screen } from "@/tests/test-utils";

const navigate = vi.fn();
const mutate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}));

vi.mock("@/domains/tickets/mutations", () => ({
  useCreateTicketFromFindingMutation: () => ({ mutate, isPending: false }),
}));

const PROJECT_ID = "11111111-1111-1111-1111-111111111111";
const FINDING_KEY = "npm:lodash:ghsa-1";

describe("FindingTicketCell", () => {
  beforeEach(() => {
    navigate.mockReset();
    mutate.mockReset();
  });

  it("affiche le ticket lié et ouvre son détail au clic", async () => {
    const { user } = render(
      <FindingActionsProvider
        projectId={PROJECT_ID}
        remediationAvailable={false}
      >
        <FindingTicketCell
          kind={FindingKind.Vulnerability}
          findingKey={FINDING_KEY}
          linkedTicket={{ id: "t-1", reference: "TKT-000042", status: "new" }}
          actionable
        />
      </FindingActionsProvider>,
    );

    await user.click(await screen.findByText("TKT-000042"));

    expect(navigate).toHaveBeenCalledWith({
      to: "/tickets/$id",
      params: { id: "t-1" },
    });
    expect(mutate).not.toHaveBeenCalled();
  });

  it("n'affiche aucune action quand le finding n'est pas actionnable", async () => {
    render(
      <FindingActionsProvider
        projectId={PROJECT_ID}
        remediationAvailable={false}
      >
        <FindingTicketCell
          kind={FindingKind.OutdatedDependency}
          findingKey="npm:express"
          linkedTicket={null}
          actionable={false}
        />
      </FindingActionsProvider>,
    );

    expect(await screen.findByText("—")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("crée le ticket depuis le finding puis ouvre son détail", async () => {
    mutate.mockImplementation((_variables, options) =>
      options.onSuccess({ id: "t-2" }),
    );

    const { user } = render(
      <FindingActionsProvider
        projectId={PROJECT_ID}
        remediationAvailable={false}
      >
        <FindingTicketCell
          kind={FindingKind.EolRuntime}
          findingKey="nodejs"
          linkedTicket={null}
          actionable
        />
      </FindingActionsProvider>,
    );

    await user.click(await screen.findByRole("button"));

    expect(mutate).toHaveBeenCalledWith(
      {
        data: {
          projectId: PROJECT_ID,
          kind: FindingKind.EolRuntime,
          findingKey: "nodejs",
        },
      },
      expect.any(Object),
    );
    expect(navigate).toHaveBeenCalledWith({
      to: "/tickets/$id",
      params: { id: "t-2" },
    });
  });
});
