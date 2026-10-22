import { describe, expect, it, vi } from "vitest";
import type { Remediation } from "@/domains/projects/types";
import { RemediationCell } from "@/features/techHealth/pages/ProjectDetailPage/components/RemediationCell";
import { FindingActionsContext } from "@/features/techHealth/pages/ProjectDetailPage/findingActions";
import { render, screen } from "@/tests/test-utils";

const FINDING_KEY = "npm:lodash:ghsa-1";
const MERGE_REQUEST_URL =
  "https://git.example.com/group/app/-/merge_requests/7";

const remediationWith = (overrides: Partial<Remediation>): Remediation => ({
  id: "r-1",
  status: "Queued",
  targetVersion: "4.17.21",
  mergeRequestUrl: null,
  failureCode: null,
  createdAt: "2026-10-22T10:00:00Z",
  updatedAt: "2026-10-22T10:00:00Z",
  ...overrides,
});

const renderCell = (
  props: Partial<React.ComponentProps<typeof RemediationCell>>,
  remediationAvailable = true,
) => {
  const startRemediation = vi.fn();

  const view = render(
    <FindingActionsContext.Provider
      value={{
        createTicket: vi.fn(),
        creatingFindingKey: null,
        removeSuppression: vi.fn(),
        removingSuppressionId: null,
        remediationAvailable,
        startRemediation,
        startingRemediationKey: null,
      }}
    >
      <RemediationCell
        findingKey={FINDING_KEY}
        canRemediate
        isMajorUpgrade={false}
        {...props}
      />
    </FindingActionsContext.Provider>,
  );

  return { ...view, startRemediation };
};

describe("RemediationCell", () => {
  it("lance la correction au clic quand elle est disponible", async () => {
    const { user, startRemediation } = renderCell({});

    await user.click(screen.getByRole("button"));

    expect(startRemediation).toHaveBeenCalledWith(FINDING_KEY);
  });

  it("n'affiche rien quand la correction automatique est indisponible", () => {
    renderCell({}, false);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("n'affiche rien pour une vulnérabilité non corrigeable", () => {
    renderCell({ canRemediate: false });

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("indique une correction en cours", () => {
    renderCell({ remediation: remediationWith({ status: "Running" }) });

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("propose le lien vers la merge request ouverte", () => {
    renderCell({
      remediation: remediationWith({
        status: "Opened",
        mergeRequestUrl: MERGE_REQUEST_URL,
      }),
    });

    expect(screen.getByRole("link")).toHaveAttribute("href", MERGE_REQUEST_URL);
  });

  it("propose de relancer après un échec", async () => {
    const { user, startRemediation } = renderCell({
      remediation: remediationWith({ status: "Failed" }),
    });

    await user.click(screen.getByRole("button"));

    expect(startRemediation).toHaveBeenCalledWith(FINDING_KEY);
  });
});
