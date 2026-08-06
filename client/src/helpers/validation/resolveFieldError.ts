import type { FieldError } from "react-hook-form";

export function resolveFieldError(
  error: FieldError | undefined,
  t: (key: string) => string,
): string | undefined {
  return error?.message ? t(error.message) : undefined;
}
