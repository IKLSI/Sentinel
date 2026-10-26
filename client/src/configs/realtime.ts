import type { HubConnection } from "@microsoft/signalr";
import { refreshAccessToken } from "@/configs/apiClient";
import { API_BASE_URL } from "@/configs/env";
import { getAccessToken } from "@/configs/session";
import { REALTIME_HUB_PATH } from "@/domains/realtime/contract.gen";
import { isAccessTokenExpiring } from "@/helpers/accessToken";

const resolveAccessToken = async (): Promise<string> => {
  const token = getAccessToken();
  if (token && !isAccessTokenExpiring(token)) return token;

  try {
    return await refreshAccessToken(token);
  } catch {
    return token ?? "";
  }
};

export const createRealtimeConnection = async (): Promise<HubConnection> => {
  const { HubConnectionBuilder } = await import("@microsoft/signalr");
  return new HubConnectionBuilder()
    .withUrl(`${API_BASE_URL}${REALTIME_HUB_PATH}`, {
      accessTokenFactory: resolveAccessToken,
    })
    .withAutomaticReconnect()
    .build();
};
