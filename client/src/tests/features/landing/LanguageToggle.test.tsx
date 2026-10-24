import { describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "@/constants/storage";
import { Language } from "@/enums";
import { LanguageToggle } from "@/features/landing/pages/LandingPage/components/LanguageToggle";
import { render, screen } from "@/tests/test-utils";

describe("LanguageToggle", () => {
  it("marque la langue active", async () => {
    render(<LanguageToggle />, { language: Language.Fr });

    expect(
      await screen.findByRole("button", { name: "landing.footer.language_fr" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: "landing.footer.language_en" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("bascule vers l'anglais et mémorise le choix", async () => {
    const { user } = render(<LanguageToggle />, { language: Language.Fr });

    await user.click(
      await screen.findByRole("button", { name: "landing.footer.language_en" }),
    );

    expect(
      await screen.findByRole("button", { name: "landing.footer.language_en" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(localStorage.getItem(STORAGE_KEYS.LANGUAGE)).toBe(Language.En);
  });

  it("bascule vers l'autre langue en recliquant sur la langue active", async () => {
    const { user } = render(<LanguageToggle />, { language: Language.Fr });

    await user.click(
      await screen.findByRole("button", { name: "landing.footer.language_fr" }),
    );

    expect(
      await screen.findByRole("button", { name: "landing.footer.language_en" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(localStorage.getItem(STORAGE_KEYS.LANGUAGE)).toBe(Language.En);
  });
});
