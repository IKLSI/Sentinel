export type ApiErrorTranslation = {
  code: string;
  params?: Record<string, string>;
};

type ValidationErrorItem = {
  code?: string;
  params?: Record<string, string>;
};

type ApiErrorBody = {
  code?: string;
  params?: Record<string, string>;
  errors?: Record<string, ValidationErrorItem[]>;
};

type AxiosLikeError = {
  response?: {
    data?: ApiErrorBody | string;
    status?: number;
  };
};

export function extractApiErrorCode(err: unknown): ApiErrorTranslation | null {
  const data = (err as AxiosLikeError)?.response?.data;

  if (!data || typeof data !== "object") return null;

  if (data.errors) {
    const first = Object.values(data.errors)
      .flat()
      .find((item) => typeof item?.code === "string" && item.code.length > 0);
    if (first?.code) return { code: first.code, params: first.params };
  }

  if (typeof data.code === "string" && data.code.length > 0)
    return { code: data.code, params: data.params };

  return null;
}
