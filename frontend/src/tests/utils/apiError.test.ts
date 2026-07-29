import { describe, expect, it } from "vitest";
import { extractApiErrorCode } from "@/utils/apiError";

describe("extractApiErrorCode", () => {
  it("returns null when err undefined", () => {
    expect(extractApiErrorCode(undefined)).toBeNull();
  });

  it("returns null for a plain string body", () => {
    const err = { response: { data: "Erreur backend" } };
    expect(extractApiErrorCode(err)).toBeNull();
  });

  it("returns the error code with its params", () => {
    const err = {
      response: {
        data: {
          code: "errors.quota.projects_exceeded",
          params: { limit: "3" },
        },
      },
    };
    expect(extractApiErrorCode(err)).toEqual({
      code: "errors.quota.projects_exceeded",
      params: { limit: "3" },
    });
  });

  it("returns the first validation error code", () => {
    const err = {
      response: {
        data: {
          code: "errors.common.validation_failed",
          errors: {
            email: [{ code: "validation.account.email_invalid_format" }],
            password: [
              {
                code: "validation.password.min_length",
                params: { minLength: "12" },
              },
            ],
          },
        },
      },
    };
    expect(extractApiErrorCode(err)).toEqual({
      code: "validation.account.email_invalid_format",
      params: undefined,
    });
  });

  it("returns null for empty object response", () => {
    const err = { response: { data: {} } };
    expect(extractApiErrorCode(err)).toBeNull();
  });
});
