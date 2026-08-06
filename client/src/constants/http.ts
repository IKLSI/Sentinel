export const HTTP_HEADERS = {
  CONTENT_TYPE: "Content-Type",
  AUTHORIZATION: "Authorization",
} as const;

export const CONTENT_TYPES = {
  JSON: "application/json",
  MULTIPART: "multipart/form-data",
} as const;

export const bearerToken = (token: string): string => `Bearer ${token}`;
