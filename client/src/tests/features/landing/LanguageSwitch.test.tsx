import { describe, expect, it } from "vitest";
import { LanguageSwitch } from "@/features/landing/pages/LandingPage/components/LanguageSwitch";
import { STORAGE_KEYS } from "@/constants/storage";
import { Language } from "@/enums";
import { render, screen } from "@/tests/test-utils";

describe("LanguageSwitch", () => {
  it("marque la langue active", async () => {
    render(<LanguageSwitch />, { language: Language.Fr });

    expect(
      await screen.findByRole("button", { name: "profile.language.fr" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: "profile.language.en" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("bascule vers l'anglais et mémorise le choix", async () => {
    const { user } = render(<LanguageSwitch />, { language: Language.Fr });

    await user.click(
      await screen.findByRole("button", { name: "profile.language.en" }),
    );

    expect(
      await screen.findByRole("button", { name: "profile.language.en" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(localStorage.getItem(STORAGE_KEYS.LANGUAGE)).toBe(Language.En);
  });
});
