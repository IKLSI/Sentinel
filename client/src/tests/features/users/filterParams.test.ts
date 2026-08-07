import { describe, expect, it } from "vitest";
import {
  criterionFromSearch,
  queryFromCriterion,
  searchFromCriterion,
} from "@/features/users/pages/UsersPage/filterParams";

describe("criterionFromSearch", () => {
  it("lit les valeurs multiples d'un champ", () => {
    expect(criterionFromSearch({ status: "Active,Suspended" })).toEqual({
      field: "status",
      values: ["Active", "Suspended"],
    });
  });

  it("ne retient qu'un seul champ quand l'URL en porte plusieurs", () => {
    expect(criterionFromSearch({ role: "Admin", status: "Active" })).toEqual({
      field: "role",
      values: ["Admin"],
    });
  });

  it("déduplique et retire les espaces superflus", () => {
    expect(criterionFromSearch({ role: " Admin , Developer , Admin" })).toEqual({
      field: "role",
      values: ["Admin", "Developer"],
    });
  });

  it("ne retient aucun critère sans valeur", () => {
    expect(criterionFromSearch({ role: "", status: " , " })).toBeNull();
  });
});

describe("searchFromCriterion", () => {
  it("sérialise les valeurs du champ retenu", () => {
    expect(
      searchFromCriterion({ field: "status", values: ["Active", "Suspended"] }),
    ).toEqual({ role: undefined, status: "Active,Suspended" });
  });

  it("vide tous les champs quand il n'y a plus de critère", () => {
    const search = searchFromCriterion(null);

    expect(Object.values(search).every((value) => value === undefined)).toBe(
      true,
    );
  });

  it("fait un aller-retour stable avec criterionFromSearch", () => {
    const criterion = criterionFromSearch({ role: "Developer" });

    expect(criterionFromSearch(searchFromCriterion(criterion))).toEqual(
      criterion,
    );
  });
});

describe("queryFromCriterion", () => {
  it("produit un tableau pour l'API", () => {
    expect(
      queryFromCriterion({ field: "role", values: ["Admin", "Developer"] }),
    ).toEqual({ role: ["Admin", "Developer"] });
  });

  it("ne produit rien sans critère", () => {
    expect(queryFromCriterion(null)).toEqual({});
  });
});
