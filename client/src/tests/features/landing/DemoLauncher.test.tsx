import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import apiClient from "@/configs/apiClient";
import { DemoLauncher } from "@/features/landing/pages/LandingPage/components/DemoLauncher";
import { render, screen } from "@/tests/test-utils";

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const defaultAdapter = apiClient.defaults.adapter;
const LAZY_DEMO_TIMEOUT_MS = 5000;

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverStub);
  apiClient.defaults.adapter = (config) =>
    Promise.reject(new Error(`Unmocked HTTP call: ${config.url}`));
});

afterAll(() => {
  vi.unstubAllGlobals();
  apiClient.defaults.adapter = defaultAdapter;
});

describe("DemoLauncher", () => {
  it("affiche l'aperçu fixe sans monter la démo interactive", async () => {
    render(<DemoLauncher />);

    expect(
      await screen.findByRole("button", { name: "landing.demo.activate" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("dashboard.projects.title"),
    ).not.toBeInTheDocument();
  });

  it("monte la démo interactive à l'activation de l'aperçu", async () => {
    const { user } = render(<DemoLauncher />);

    await user.click(
      await screen.findByRole("button", { name: "landing.demo.activate" }),
    );

    expect(
      await screen.findByText(
        "dashboard.projects.title",
        {},
        { timeout: LAZY_DEMO_TIMEOUT_MS },
      ),
    ).toBeInTheDocument();
  });

  it("ouvre directement le plein écran depuis le bouton dédié", async () => {
    const { user } = render(<DemoLauncher />);

    await user.click(
      await screen.findByRole("button", {
        name: "landing.demo.open_fullscreen",
      }),
    );

    expect(
      await screen.findByRole(
        "dialog",
        { name: "landing.demo.fullscreen_label" },
        { timeout: LAZY_DEMO_TIMEOUT_MS },
      ),
    ).toBeInTheDocument();
  });
});
