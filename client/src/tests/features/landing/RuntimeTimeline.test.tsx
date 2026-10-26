import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import apiClient from "@/configs/apiClient";
import type { RuntimeLifecycles } from "@/domains/publicScan/types";
import { RuntimeTimeline } from "@/features/landing/pages/LandingPage/components/RuntimeTimeline";
import { render, screen } from "@/tests/test-utils";

const TRANSLATIONS = {
  "landing.timeline.title_multiple": "{names} s'arrêtent dans {duration}.",
  "landing.timeline.title_single": "{names} s'arrête dans {duration}.",
  "landing.timeline.title_fallback": "Chaque runtime a une date de fin de vie.",
  "landing.timeline.conjunction": "et",
  "landing.timeline.days_other": "{count} jours",
  "landing.timeline.subtitle": "Sentinel vous prévient {days} jours avant.",
  "landing.timeline.status.approaching_other": "Dans {count} jours",
  "landing.timeline.status.ended_other": "Fin de vie depuis {count} jours",
};

const lifecycles: { current: RuntimeLifecycles } = {
  current: {
    asOf: "2026-10-21T00:00:00Z",
    warningWindowDays: 90,
    upcomingNames: [".NET 8", ".NET 9"],
    upcomingDays: 20,
    items: [
      {
        name: ".NET 8",
        releaseDate: "2023-11-14T00:00:00Z",
        endOfLifeDate: "2026-11-10T00:00:00Z",
        status: "approaching",
        daysRemaining: 20,
      },
      {
        name: "Node.js 20",
        releaseDate: "2023-04-18T00:00:00Z",
        endOfLifeDate: "2026-04-30T00:00:00Z",
        status: "ended",
        daysRemaining: -174,
      },
    ],
  },
};

vi.mock("@/domains/publicScan/queries", () => ({
  useRuntimeLifecyclesQuery: () => ({
    data: lifecycles.current,
    isPending: false,
    isError: false,
  }),
}));

const defaultAdapter = apiClient.defaults.adapter;

beforeAll(() => {
  apiClient.defaults.adapter = (config) =>
    Promise.resolve({
      data:
        config.responseType === "text"
          ? JSON.stringify(TRANSLATIONS)
          : TRANSLATIONS,
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    });
});

afterAll(() => {
  apiClient.defaults.adapter = defaultAdapter;
});

describe("RuntimeTimeline", () => {
  it("construit le titre à partir des prochaines fins de vie", async () => {
    render(<RuntimeTimeline />);

    expect(
      await screen.findByRole("heading", {
        name: ".NET 8 et .NET 9 s'arrêtent dans 20 jours.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Sentinel vous prévient 90 jours avant."),
    ).toBeInTheDocument();
    expect(screen.getByText("Dans 20 jours")).toBeInTheDocument();
    expect(screen.getByText("Fin de vie depuis 174 jours")).toBeInTheDocument();
  });

  it("affiche un titre générique sans échéance à venir", async () => {
    lifecycles.current = {
      ...lifecycles.current,
      upcomingNames: [],
      upcomingDays: null,
    };

    render(<RuntimeTimeline />);

    expect(
      await screen.findByRole("heading", {
        name: "Chaque runtime a une date de fin de vie.",
      }),
    ).toBeInTheDocument();
  });
});
