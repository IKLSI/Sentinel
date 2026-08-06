import type { components } from "@/types/api.gen";
import type { ApiKeySortField, SortDirection } from "@/enums";

export type ApiKey = components["schemas"]["ApiKeyDto"];

export type CreatedApiKey = components["schemas"]["CreatedApiKeyDto"];

export type CreateApiKey = components["schemas"]["CreateApiKeyDto"];

export type ApiKeysFilters = {
  sortBy?: ApiKeySortField;
  sortDirection?: SortDirection;
};
