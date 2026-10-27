import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Remediation } from "@/domains/projects/types";
import { RemediateAllAction } from "@/features/projects/pages/ProjectDetailPage/components/RemediateAllAction";
import { render, screen } from "@/tests/test-utils";

const mutate = vi.fn();

vi.mock("@/domains/projects/mutations", () => ({
  useStartRemediationMutation: () => ({ mutate, isPending: false }),
}));

const PROJECT_ID = "11111111-1111-1111-1111-111111111111";
const MERGE_REQUEST_URL =
  "https://git.example.com/group/app/-/merge_requests/7";

const remediationWith = (overrides: Partial<Remediation>): Remediation => ({
  id: "r-1",
  status: "Queued",
  mergeRequestUrl: null,
  failureCode: null,
  createdAt: "2026-10-22T10:00:00Z",
  updatedAt: "2026-10-22T10:00:00Z",
  ...overrides,
});

const renderAction = (
  props: Partial<React.ComponentProps<typeof RemediateAllAction>> = {},
) =>
  render(
    <RemediateAllAction
      projectId={PROJECT_ID}
      remediationAvailable
      remediableVulnerabilities={3}
      includesMajorUpgrade={false}
      remediation={null}
      {...props}
    />,
  );

describe("RemediateAllAction", () => {
  beforeEach(() => {
    mutate.mockReset();
  });

  it("lance la correction groupée du projet au clic", async () => {
    const { user } = renderAction();

    await user.click(screen.getByRole("button"));

    expect(mutate).toHaveBeenCalledWith({ id: PROJECT_ID }, expect.anything());
  });

  it("n'affiche rien quand la correction automatique est indisponible", () => {
    renderAction({ remediationAvailable: false });

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("n'affiche rien quand aucune vulnérabilité n'est corrigeable", () => {
    renderAction({ remediableVulnerabilities: 0 });

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("désactive l'action pendant une correction en cours", () => {
    renderAction({ remediation: remediationWith({ status: "Running" }) });

    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("n'affiche pas de lien vers la merge request ouverte", () => {
    renderAction({
      remediation: remediationWith({
        status: "Opened",
        mergeRequestUrl: MERGE_REQUEST_URL,
      }),
    });

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByRole("button")).toBeEnabled();
  });

  it("propose de relancer après un échec", async () => {
    const { user } = renderAction({
      remediation: remediationWith({ status: "Failed" }),
    });

    await user.click(screen.getByRole("button"));

    expect(mutate).toHaveBeenCalledTimes(1);
  });
});
