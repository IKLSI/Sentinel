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

let isRefreshing = false;
let pendingRequests: Array<(token: string) => void> = [];

const processQueue = (token: string) => {
  pendingRequests.forEach((resolve) => {
    resolve(token);
  });
  pendingRequests = [];
};

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes(ROUTES_API.api.auth.login.__path)
    ) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingRequests.push((token: string) => {
            originalRequest.headers.Authorization = bearerToken(token);
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(
          `${API_BASE_URL}${ROUTES_API.api.auth.refresh.__path}`,
          {},
          { withCredentials: true },
        );
        const { accessToken } = response.data;
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        processQueue(accessToken);
        isRefreshing = false;
        originalRequest.headers.Authorization = bearerToken(accessToken);
        return apiClient(originalRequest);
      } catch (error) {
        console.error("Token refresh failed:", error);
        isRefreshing = false;
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        window.location.href = ROUTES.LOGIN;
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
