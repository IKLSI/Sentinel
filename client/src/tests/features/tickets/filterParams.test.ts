import { describe, expect, it } from "vitest";
import {
  criterionFromSearch,
  queryFromCriterion,
  searchFromCriterion,
  UNSET_FILTER_VALUE,
} from "@/features/tickets/pages/TicketsPage/filterParams";

const ASSIGNEE_ID = "3f1a7c22-9b64-4d1e-8a2f-5c0e7b93d411";

describe("criterionFromSearch", () => {
  it("lit les valeurs multiples d'un champ", () => {
    expect(criterionFromSearch({ status: "closed,resolved" })).toEqual({
      field: "status",
      values: ["closed", "resolved"],
    });
  });

  it("ne retient qu'un seul champ quand l'URL en porte plusieurs", () => {
    expect(criterionFromSearch({ priority: "high", type: "bug" })).toEqual({
      field: "priority",
      values: ["high"],
    });
  });

  it("déduplique et retire les espaces superflus", () => {
    expect(
      criterionFromSearch({ priority: " high , critical , high" }),
    ).toEqual({ field: "priority", values: ["high", "critical"] });
  });

  it("conserve la valeur non affectée sur les références", () => {
    expect(
      criterionFromSearch({
        assignedTo: `${UNSET_FILTER_VALUE},${ASSIGNEE_ID}`,
      }),
    ).toEqual({
      field: "assignedTo",
      values: [UNSET_FILTER_VALUE, ASSIGNEE_ID],
    });
  });

  it("ne retient aucun critère sans valeur", () => {
    expect(criterionFromSearch({ priority: "", status: " , " })).toBeNull();
  });
});

describe("searchFromCriterion", () => {
  it("sérialise les valeurs du champ retenu", () => {
    expect(
      searchFromCriterion({ field: "status", values: ["closed", "resolved"] }),
    ).toEqual({
      priority: undefined,
      status: "closed,resolved",
      type: undefined,
      assignedTo: undefined,
      project: undefined,
    });
  });

  it("vide tous les champs quand il n'y a plus de critère", () => {
    const search = searchFromCriterion(null);

    expect(Object.values(search).every((value) => value === undefined)).toBe(
      true,
    );
  });

  it("fait un aller-retour stable avec criterionFromSearch", () => {
    const criterion = criterionFromSearch({ project: ASSIGNEE_ID });

    expect(criterionFromSearch(searchFromCriterion(criterion))).toEqual(
      criterion,
    );
  });
});

describe("queryFromCriterion", () => {
  it("produit un tableau pour l'API", () => {
    expect(
      queryFromCriterion({ field: "type", values: ["bug", "security"] }),
    ).toEqual({ type: ["bug", "security"] });
  });

  it("ne produit rien sans critère", () => {
    expect(queryFromCriterion(null)).toEqual({});
  });
});
