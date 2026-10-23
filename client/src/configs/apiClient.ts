import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import { ROUTES_API } from "@/configs/api-routes.gen";
import { API_BASE_URL } from "@/configs/env";
import { CONTENT_TYPES, HTTP_HEADERS, bearerToken } from "@/constants/http";
import {
  endSession,
  getAccessToken,
  startSession,
  subjectOf,
} from "@/configs/session";
import { ROUTES } from "@/constants/routes";

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { [HTTP_HEADERS.CONTENT_TYPE]: CONTENT_TYPES.JSON },
  withCredentials: true,
  paramsSerializer: { indexes: null },
});

const API_ORIGIN = new URL(
  API_BASE_URL || window.location.origin,
  window.location.origin,
).origin;

const targetsApiOrigin = (config: InternalAxiosRequestConfig): boolean =>
  new URL(config.url ?? "", config.baseURL ?? window.location.origin).origin ===
  API_ORIGIN;

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token && config.headers && targetsApiOrigin(config))
    config.headers.Authorization = bearerToken(token);
  return config;
});

const TOKEN_REFRESH_LOCK = "sentinel:access-token-refresh";

let refreshInFlight: Promise<string> | null = null;

const requestNewAccessToken = async (): Promise<string> => {
  const response = await axios.post(
    `${API_BASE_URL}${ROUTES_API.api.auth.refresh.__path}`,
    {},
    { withCredentials: true },
  );
  const { accessToken } = response.data;
  const previousToken = getAccessToken();
  startSession(accessToken);
  if (previousToken && subjectOf(previousToken) !== subjectOf(accessToken))
    window.location.reload();
  return accessToken;
};

const refreshUnlessAlreadyRenewed = (
  staleToken: string | null,
): Promise<string> => {
  const current = getAccessToken();
  return current && current !== staleToken
    ? Promise.resolve(current)
    : requestNewAccessToken();
};

export const refreshAccessToken = (
  staleToken: string | null,
): Promise<string> => {
  refreshInFlight ??= (
    navigator.locks
      ? navigator.locks.request(TOKEN_REFRESH_LOCK, () =>
          refreshUnlessAlreadyRenewed(staleToken),
        )
      : refreshUnlessAlreadyRenewed(staleToken)
  ).finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
};

const tokenOf = (authorization: unknown): string | null =>
  typeof authorization === "string"
    ? authorization.replace(/^Bearer /, "")
    : null;

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;
    const sentToken = tokenOf(originalRequest?.headers?.Authorization);

    if (
      error.response?.status === 401 &&
      sentToken !== null &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const accessToken = await refreshAccessToken(sentToken);
        originalRequest.headers.Authorization = bearerToken(accessToken);
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        endSession();
        window.location.href = ROUTES.LOGIN;
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
