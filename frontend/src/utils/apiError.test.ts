import { describe, expect, it } from "vitest";
import { extractApiError } from "./apiError";

describe("extractApiError", () => {
  it("returns fallback when err undefined", () => {
    expect(extractApiError(undefined, "fallback")).toBe("fallback");
  });

  it("returns string body directly", () => {
    const err = { response: { data: "Erreur backend" } };
    expect(extractApiError(err, "fallback")).toBe("Erreur backend");
  });

  it("returns first validation error message", () => {
    const err = {
      response: {
        data: {
          errors: { Email: ["Email invalide"], Password: ["Trop court"] },
        },
      },
    };
    expect(extractApiError(err, "fallback")).toBe("Email invalide");
  });

  it("prefers message over detail and title", () => {
    const err = {
      response: {
        data: { message: "msg", detail: "detail", title: "title" },
      },
    };
    expect(extractApiError(err, "fallback")).toBe("msg");
  });

  it("uses detail when message absent", () => {
    const err = { response: { data: { detail: "détail" } } };
    expect(extractApiError(err, "fallback")).toBe("détail");
  });

  it("returns fallback for empty object response", () => {
    const err = { response: { data: {} } };
    expect(extractApiError(err, "fallback")).toBe("fallback");
  });
});
