import type { RealtimeResource } from "@/domains/realtime/contract.gen";

export type RealtimeEvent = {
  resource: RealtimeResource;
  id?: string;
};
