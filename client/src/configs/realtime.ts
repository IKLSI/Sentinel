import { HubConnectionBuilder, type HubConnection } from "@microsoft/signalr";
import { refreshAccessToken } from "@/configs/apiClient";
import { API_BASE_URL } from "@/configs/env";
import { REALTIME_HUB_PATH } from "@/domains/realtime/contract.gen";
import { STORAGE_KEYS } from "@/constants/storage";
import { isAccessTokenExpiring } from "@/helpers/accessToken";

const resolveAccessToken = async (): Promise<string> => {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  if (token && !isAccessTokenExpiring(token)) return token;

  try {
    return await refreshAccessToken(token);
  } catch {
    return token ?? "";
  }
};

export const createRealtimeConnection = (): HubConnection =>
  new HubConnectionBuilder()
    .withUrl(`${API_BASE_URL}${REALTIME_HUB_PATH}`, {
      accessTokenFactory: resolveAccessToken,
    })
    .withAutomaticReconnect()
    .build();
