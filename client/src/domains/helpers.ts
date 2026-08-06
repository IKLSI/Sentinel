import type { AxiosRequestConfig } from "axios";
import {
  useMutation,
  useQuery,
  type QueryKey,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import apiClient from "@/configs/apiClient";
import { queryClient } from "@/configs/queryClient";
import { buildUrl } from "@/helpers/url";
import type {
  FilterPaginationAndSortType,
  HttpMethod,
  MutationFunctionVariables,
  MutationWrapperOptions,
  QueryWrapperOptions,
  UrlParamsType,
} from "@/domains/types";

const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PATCH: "PATCH",
  PUT: "PUT",
  DELETE: "DELETE",
} as const satisfies Record<HttpMethod, HttpMethod>;

async function apiRequest<TResponse>(
  method: HttpMethod,
  url: string,
  config: AxiosRequestConfig = {},
): Promise<TResponse> {
  const response = await apiClient.request<TResponse>({
    method,
    url,
    ...config,
  });
  return response.data;
}

export function invalidateKeys(keys: QueryKey[] = []): void {
  for (const queryKey of keys) queryClient.invalidateQueries({ queryKey });
}

/** @public */
export function useQueryWrapper<TResponse, TResult = TResponse>(
  method: HttpMethod,
  urlTemplate: string,
  params: UrlParamsType = {},
  options: QueryWrapperOptions<TResponse, TResult> = {},
  filtersPaginationAndSort: FilterPaginationAndSortType = {},
): UseQueryResult<TResult> {
  const { queryKey, ...queryOptions } = options;

  return useQuery<TResponse, Error, TResult, QueryKey>({
    queryKey: queryKey ?? [urlTemplate, params, filtersPaginationAndSort],
    queryFn: ({ signal }) =>
      apiRequest<TResponse>(method, buildUrl(urlTemplate, params), {
        params: filtersPaginationAndSort,
        signal,
      }),
    ...queryOptions,
  });
}

export function useMutationWrapper<
  TResponse,
  TResult = TResponse,
  TVariables extends MutationFunctionVariables = MutationFunctionVariables,
>(
  method: HttpMethod,
  urlTemplate: string,
  options: MutationWrapperOptions<TResponse, TResult, TVariables> = {},
): UseMutationResult<TResult, Error, TVariables> {
  const { mapResponse, axiosOptions, ...mutationOptions } = options;

  return useMutation<TResult, Error, TVariables>({
    mutationFn: async (variables) => {
      const { data, ...params } = variables ?? ({} as TVariables);
      const response = await apiRequest<TResponse>(
        method,
        buildUrl(urlTemplate, params),
        { ...axiosOptions, data },
      );
      return mapResponse ? mapResponse(response) : (response as never);
    },
    ...mutationOptions,
  });
}

export const useGetQuery = <TResponse, TResult = TResponse>(
  urlTemplate: string,
  params?: UrlParamsType,
  options?: QueryWrapperOptions<TResponse, TResult>,
  filtersPaginationAndSort?: FilterPaginationAndSortType,
) =>
  useQueryWrapper<TResponse, TResult>(
    HTTP_METHODS.GET,
    urlTemplate,
    params,
    options,
    filtersPaginationAndSort,
  );

export const usePostMutation = <
  TResponse,
  TResult = TResponse,
  TVariables extends MutationFunctionVariables = MutationFunctionVariables,
>(
  urlTemplate: string,
  options?: MutationWrapperOptions<TResponse, TResult, TVariables>,
) =>
  useMutationWrapper<TResponse, TResult, TVariables>(
    HTTP_METHODS.POST,
    urlTemplate,
    options,
  );

export const usePutMutation = <
  TResponse,
  TResult = TResponse,
  TVariables extends MutationFunctionVariables = MutationFunctionVariables,
>(
  urlTemplate: string,
  options?: MutationWrapperOptions<TResponse, TResult, TVariables>,
) =>
  useMutationWrapper<TResponse, TResult, TVariables>(
    HTTP_METHODS.PUT,
    urlTemplate,
    options,
  );

export const usePatchMutation = <
  TResponse,
  TResult = TResponse,
  TVariables extends MutationFunctionVariables = MutationFunctionVariables,
>(
  urlTemplate: string,
  options?: MutationWrapperOptions<TResponse, TResult, TVariables>,
) =>
  useMutationWrapper<TResponse, TResult, TVariables>(
    HTTP_METHODS.PATCH,
    urlTemplate,
    options,
  );

export const useDeleteMutation = <
  TResponse,
  TResult = TResponse,
  TVariables extends MutationFunctionVariables = MutationFunctionVariables,
>(
  urlTemplate: string,
  options?: MutationWrapperOptions<TResponse, TResult, TVariables>,
) =>
  useMutationWrapper<TResponse, TResult, TVariables>(
    HTTP_METHODS.DELETE,
    urlTemplate,
    options,
  );
