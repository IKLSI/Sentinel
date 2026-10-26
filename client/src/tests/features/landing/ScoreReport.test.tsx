import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import apiClient from "@/configs/apiClient";
import type { ScoringModel } from "@/domains/publicScan/types";
import { ScoreReport } from "@/features/landing/pages/LandingPage/components/ScoreReport";
import { render, screen, within } from "@/tests/test-utils";

const TRANSLATIONS = {
  "landing.score.line.critical_vulnerability_one":
    "{count} vulnérabilité critique",
  "landing.score.line.high_vulnerability_other":
    "{count} vulnérabilités élevées",
  "landing.score.line.version_lag": "Retard de versions",
  "landing.score.line.eol_runtime": "{runtime} en fin de vie",
  "landing.score.detail.outdated_other": "{count} directes sur {total}",
  "landing.score.detail.eol_since": "depuis le {date}",
  "landing.score.modifier.actively_exploited": "exploitée activement",
  "landing.score.ceiling.actively_exploited":
    "Plafond {ceiling} tant qu'une faille exploitée reste ouverte.",
  "landing.score.ceiling.none":
    "Aucun plafond : aucune faille critique ouverte.",
  "landing.score.total_points": "{points} points",
  "landing.score.out_of_100": "sur 100",
};

const SCORING_MODEL: ScoringModel = {
  grades: [
    { grade: "A", minScore: 90 },
    { grade: "B", minScore: 75 },
    { grade: "C", minScore: 60 },
    { grade: "D", minScore: 45 },
    { grade: "E", minScore: 30 },
    { grade: "F", minScore: 0 },
  ],
  penalties: [],
  maxScore: 100,
  scoreDecayConstant: 150,
  examples: [
    {
      name: "Boutique en ligne",
      score: 28,
      rawScore: 28,
      grade: "F",
      ceiling: 59,
      ceilingReason: "actively_exploited",
      totalPenalty: 189.2,
      lines: [
        {
          kind: "high_vulnerability",
          modifiers: [],
          multiplier: null,
          count: 6,
          points: 60,
          identifiers: [],
          packages: ["axios"],
          runtimeName: null,
          runtimeVersion: null,
          eolDate: null,
          outdated: null,
          totalDirect: null,
        },
        {
          kind: "critical_vulnerability",
          modifiers: ["actively_exploited"],
          multiplier: 2,
          count: 1,
          points: 30,
          identifiers: ["CVE-2025-55182"],
          packages: ["react-server-dom-webpack"],
          runtimeName: null,
          runtimeVersion: null,
          eolDate: null,
          outdated: null,
          totalDirect: null,
        },
        {
          kind: "version_lag",
          modifiers: [],
          multiplier: null,
          count: 1,
          points: 37.5,
          identifiers: [],
          packages: [],
          runtimeName: null,
          runtimeVersion: null,
          eolDate: null,
          outdated: 18,
          totalDirect: 31,
        },
        {
          kind: "eol_runtime",
          modifiers: [],
          multiplier: null,
          count: 1,
          points: 15,
          identifiers: [],
          packages: [],
          runtimeName: "Node.js",
          runtimeVersion: "20",
          eolDate: "2026-04-30T00:00:00Z",
          outdated: null,
          totalDirect: null,
        },
      ],
    },
    {
      name: "Portail client",
      score: 82,
      rawScore: 82,
      grade: "B",
      ceiling: null,
      ceilingReason: null,
      totalPenalty: 30,
      lines: [],
    },
  ],
};

vi.mock("@/domains/publicScan/queries", () => ({
  useScoringModelQuery: () => ({
    data: SCORING_MODEL,
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

describe("ScoreReport", () => {
  it("affiche les lignes de pénalité du premier exemple", async () => {
    render(<ScoreReport />);

    expect(
      await screen.findByText("6 vulnérabilités élevées"),
    ).toBeInTheDocument();
    expect(screen.getByText("1 vulnérabilité critique")).toBeInTheDocument();
    expect(
      screen.getByText("CVE-2025-55182, exploitée activement"),
    ).toBeInTheDocument();
    expect(screen.getByText("×2")).toBeInTheDocument();
    expect(screen.getByText("18 directes sur 31")).toBeInTheDocument();
    expect(screen.getByText("Node.js 20 en fin de vie")).toBeInTheDocument();
    expect(screen.getByText("depuis le 30 avril 2026")).toBeInTheDocument();
    expect(screen.getByText("−37,5")).toBeInTheDocument();
    expect(screen.getByText("−189,2 points")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Plafond 59 tant qu'une faille exploitée reste ouverte.",
      ),
    ).toBeInTheDocument();
  });

  it("change d'exemple au clic sur un onglet", async () => {
    const { user } = render(<ScoreReport />);

    await user.click(
      await screen.findByRole("tab", { name: "Portail client" }),
    );

    expect(screen.getByRole("tab", { name: "Portail client" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    const panel = screen.getByRole("tabpanel");
    expect(
      within(panel).getByRole("img", { name: "landing.score.grade_label" }),
    ).toHaveTextContent("B");
    expect(
      within(panel).getByText(
        "Aucun plafond : aucune faille critique ouverte.",
      ),
    ).toBeInTheDocument();
  });
});
