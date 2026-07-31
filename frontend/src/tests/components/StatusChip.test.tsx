import { describe, expect, it } from "vitest";
import { StatusChip } from "@/components/ui/common/StatusChip";
import { render, screen } from "@/tests/test-utils";

describe("StatusChip", () => {
  it("affiche le libellé passé en enfant", async () => {
    render(<StatusChip variant="red">Critique</StatusChip>);

    expect(await screen.findByText("Critique")).toBeInTheDocument();
  });

  it("rend l'adornment avant le libellé", async () => {
    render(
      <StatusChip variant="green" startAdornment={<span>●</span>}>
        Résolu
      </StatusChip>,
    );

    expect(await screen.findByText("●")).toBeInTheDocument();
    expect(screen.getByText("Résolu")).toBeInTheDocument();
  });
});
