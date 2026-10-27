import { describe, expect, it, vi } from "vitest";
import { Pagination } from "@/components/ui/common/table/Pagination";
import { render, screen } from "@/tests/test-utils";

const baseProps = {
  page: 1,
  totalPages: 8,
  total: 200,
  onChange: vi.fn(),
  countLabel: "tickets",
};

describe("Pagination", () => {
  it("masque le sélecteur sans gestionnaire de taille", async () => {
    render(<Pagination {...baseProps} />);

    expect(await screen.findByText("200 tickets")).toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: "pagination.rows_per_page" }),
    ).not.toBeInTheDocument();
  });

  it("affiche la taille courante et notifie son changement", async () => {
    const onPageSizeChange = vi.fn();
    const { user } = render(
      <Pagination
        {...baseProps}
        pageSize={25}
        pageSizeOptions={[10, 25, 50]}
        onPageSizeChange={onPageSizeChange}
      />,
    );

    const current = await screen.findByRole("button", { name: "25" });
    expect(current).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "50" }));

    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });

  it("désactive la flèche précédente sur la première page", async () => {
    render(<Pagination {...baseProps} />);

    expect(
      await screen.findByRole("button", { name: "pagination.previous" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "pagination.next" }),
    ).toBeEnabled();
  });
});
