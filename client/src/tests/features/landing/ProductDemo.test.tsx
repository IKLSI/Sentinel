import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import apiClient from "@/configs/apiClient";
import { ProductDemo } from "@/features/landing/pages/LandingPage/components/ProductDemo";
import { DEMO_PROJECT_NAMES } from "@/features/landing/demo/fixtures/ids";
import { render, screen, waitFor, within } from "@/tests/test-utils";

const findProjectRow = async (name: string) => {
  const title = await screen.findByText("dashboard.projects.title");
  const section = title.closest("section");
  if (!section) throw new Error("Section des projets introuvable");
  return within(section).getByRole("button", { name: new RegExp(name) });
};

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const LOCALES_PATH = "/api/locales/";
const requestedUrls: string[] = [];
const defaultAdapter = apiClient.defaults.adapter;

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverStub);
  apiClient.defaults.adapter = (config) => {
    requestedUrls.push(config.url ?? "");
    return Promise.reject(new Error(`Unmocked HTTP call: ${config.url}`));
  };
});

afterAll(() => {
  vi.unstubAllGlobals();
  apiClient.defaults.adapter = defaultAdapter;
});

describe("ProductDemo", () => {
  it("affiche le tableau de bord de démonstration sans appel à l'API métier", async () => {
    render(<ProductDemo />);

    expect(
      await findProjectRow(DEMO_PROJECT_NAMES.storefront),
    ).toBeInTheDocument();
    expect(screen.getByText("dashboard.projects.title")).toBeInTheDocument();
    expect(
      requestedUrls.every((url) => url.toLowerCase().includes(LOCALES_PATH)),
    ).toBe(true);
  });

  it("ouvre la fiche projet au clic sur un projet", async () => {
    const { user } = render(<ProductDemo />);

    await user.click(await findProjectRow(DEMO_PROJECT_NAMES.payments));

    expect(
      await screen.findByText("tech_health.tab.vulnerabilities"),
    ).toBeInTheDocument();
    expect(screen.getByText(DEMO_PROJECT_NAMES.payments)).toBeInTheDocument();
    expect(
      screen.queryByText("dashboard.projects.title"),
    ).not.toBeInTheDocument();
  });

  it("navigue vers les tickets depuis la barre latérale de la démo", async () => {
    const { user } = render(<ProductDemo />);

    await user.click(
      await screen.findByRole("link", { name: "sidebar.section.tickets" }),
    );

    expect(
      await screen.findByText("tickets.list.col_ticket"),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe("/");
  });

  it("ouvre puis ferme la démo en plein écran", async () => {
    const { user } = render(<ProductDemo />);

    await user.click(
      await screen.findByRole("button", {
        name: "landing.demo.open_fullscreen",
      }),
    );

    const dialog = await screen.findByRole("dialog", {
      name: "landing.demo.fullscreen_label",
    });
    expect(
      await within(dialog).findByText("dashboard.projects.title"),
    ).toBeInTheDocument();

    await user.click(
      within(dialog).getByRole("button", { name: "landing.demo.close" }),
    );

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("ferme la démo en plein écran avec Échap", async () => {
    const { user } = render(<ProductDemo />);

    await user.click(
      await screen.findByRole("button", {
        name: "landing.demo.open_fullscreen",
      }),
    );
    await screen.findByRole("dialog");

    await user.keyboard("{Escape}");

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
});
