import { ROUTES_API } from "@/configs/api-routes.gen";
import { useGetQuery } from "@/domains/helpers";
import { userOptionsQueryKey, usersQueryKey } from "@/domains/users/constants";
import type { UserList, UserOption, UsersFilters } from "@/domains/users/types";

export const useUsersQuery = (filters: UsersFilters = {}) =>
  useGetQuery<UserList>(
    ROUTES_API.api.users.__path,
    {},
    {
      queryKey: usersQueryKey(filters),
      placeholderData: (previous) => previous,
    },
    filters,
  );

export const useUserOptionsQuery = () =>
  useGetQuery<UserOption[]>(
    ROUTES_API.api.users.options.__path,
    {},
    {
      queryKey: userOptionsQueryKey,
    },
  );
