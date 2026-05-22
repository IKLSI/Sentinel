import { useQuery } from "@tanstack/react-query";
import { getUsers } from "../api/users";
import { PaginatedResponse, User, UserRole } from "../../../types";

export const usersQueryKey = (params: { page?: number; role?: UserRole; search?: string }) =>
  ["users", params] as const;

export const useUsers = (
  params: { page?: number; role?: UserRole; search?: string } = {},
  enabled = true,
) => {
  return useQuery<PaginatedResponse<User>>({
    queryKey: usersQueryKey(params),
    queryFn: ({ signal }) => getUsers(params, signal),
    enabled,
    staleTime: 60_000,
  });
};
