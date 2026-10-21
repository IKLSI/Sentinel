import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/constants/routes";
import { ScanForm } from "@/features/landing/pages/LandingPage/components/ScanForm";
import { render, screen } from "@/tests/test-utils";

const navigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}));

describe("ScanForm", () => {
  beforeEach(() => {
    navigate.mockReset();
  });

  it("ouvre la page de scan avec le dépôt saisi", async () => {
    const { user } = render(<ScanForm tone="light" />);

    await user.type(
      await screen.findByRole("textbox", {
        name: "landing.scan.input_label",
      }),
      "  github.com/expressjs/express ",
    );
    await user.click(
      screen.getByRole("button", { name: "landing.cta.scan_button" }),
    );

    expect(navigate).toHaveBeenCalledWith({
      to: ROUTES.SCAN,
      search: { repo: "github.com/expressjs/express" },
    });
  });

  it("ne navigue pas sans adresse de dépôt", async () => {
    const { user } = render(<ScanForm tone="dark" />);

    await user.click(
      await screen.findByRole("button", { name: "landing.cta.scan_button" }),
    );

    expect(navigate).not.toHaveBeenCalled();
  });
});
