type ProblemDetails = {
  errors?: Record<string, string[]>;
  message?: string;
  title?: string;
  detail?: string;
};

type AxiosLikeError = {
  response?: {
    data?: ProblemDetails | string;
    status?: number;
  };
};

export function extractApiError(err: unknown, fallback: string): string {
  const ax = err as AxiosLikeError;
  const data = ax?.response?.data;

  if (typeof data === "string" && data.trim().length > 0) return data;

  if (data && typeof data === "object") {
    if (data.errors) {
      const first = Object.values(data.errors)
        .flat()
        .find((m) => typeof m === "string" && m.length > 0);
      if (first) return first;
    }
    if (data.message) return data.message;
    if (data.detail) return data.detail;
    if (data.title) return data.title;
  }

  return fallback;
}
