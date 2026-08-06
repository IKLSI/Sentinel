import { HubConnectionBuilder, type HubConnection } from "@microsoft/signalr";
import { API_BASE_URL } from "@/configs/env";
import { REALTIME_HUB_PATH } from "@/domains/realtime/contract.gen";
import { STORAGE_KEYS } from "@/constants/storage";

export const createRealtimeConnection = (): HubConnection =>
  new HubConnectionBuilder()
    .withUrl(`${API_BASE_URL}${REALTIME_HUB_PATH}`, {
      accessTokenFactory: () =>
        localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ?? "",
    })
    .withAutomaticReconnect()
    .build();
