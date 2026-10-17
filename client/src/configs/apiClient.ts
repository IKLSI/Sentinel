import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import { ROUTES_API } from "@/configs/api-routes.gen";
import { API_BASE_URL } from "@/configs/env";
import { CONTENT_TYPES, HTTP_HEADERS, bearerToken } from "@/constants/http";
import { ROUTES } from "@/constants/routes";
import { STORAGE_KEYS } from "@/constants/storage";

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { [HTTP_HEADERS.CONTENT_TYPE]: CONTENT_TYPES.JSON },
  withCredentials: true,
  paramsSerializer: { indexes: null },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  if (token && config.headers)
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
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  return accessToken;
};

const refreshUnlessAlreadyRenewed = (
  staleToken: string | null,
): Promise<string> => {
  const current = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
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

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes(ROUTES_API.api.auth.login.__path)
    ) {
      originalRequest._retry = true;

      try {
        const accessToken = await refreshAccessToken(
          tokenOf(originalRequest.headers?.Authorization),
        );
        originalRequest.headers.Authorization = bearerToken(accessToken);
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        window.location.href = ROUTES.LOGIN;
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
