import type { AxiosRequestConfig } from "axios";
import type {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
} from "@tanstack/react-query";

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export type MutationFunctionVariables = {
  data?: unknown;
  [key: string]: unknown;
};

export type FilterPaginationAndSortType = Record<string, unknown>;

export type QueryWrapperOptions<TResponse, TResult> = Omit<
  UseQueryOptions<TResponse, Error, TResult, QueryKey>,
  "queryKey" | "queryFn"
> & {
  queryKey?: QueryKey;
};

export type MutationWrapperOptions<TResponse, TResult, TVariables> = Omit<
  UseMutationOptions<TResult, Error, TVariables>,
  "mutationFn"
> & {
  mapResponse?: (response: TResponse) => TResult;
  axiosOptions?: AxiosRequestConfig;
};
