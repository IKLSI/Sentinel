import { describe, expect, it } from "vitest";
import FolderOutlined from "@mui/icons-material/FolderOutlined";
import { EmptyState } from "@/components/ui/common/feedback/EmptyState";
import { render, screen } from "@/tests/test-utils";

describe("EmptyState", () => {
  it("affiche titre, sous-titre et action", async () => {
    render(
      <EmptyState
        icon={FolderOutlined}
        title="Aucun projet"
        subtitle="Ajoutez-en un"
        action={<button type="button">Ajouter</button>}
      />,
    );

    expect(await screen.findByText("Aucun projet")).toBeInTheDocument();
    expect(screen.getByText("Ajoutez-en un")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ajouter" })).toBeInTheDocument();
  });
});
