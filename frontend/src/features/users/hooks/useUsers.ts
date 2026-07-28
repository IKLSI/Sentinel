import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserRole } from "@/types";
import {
  getUsers,
  inviteUser,
  acceptInvitation,
  toggleUserActive,
  updateMyProfile,
  updatePreferences,
  updateUserTheme,
  exportMyGdprData,
  deleteMyAccount,
} from "../api/users";

export const USERS_QUERY_KEY = "users";

const usersQueryKey = (
  params: { page?: number; role?: UserRole; search?: string } = {},
) => [USERS_QUERY_KEY, params] as const;

export const useUsers = (
  params: { page?: number; role?: UserRole; search?: string } = {},
) => {
  const query = useQuery({
    queryKey: usersQueryKey(params),
    queryFn: ({ signal }) => getUsers(params, signal),
  });

  return {
    users: query.data?.items ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useInviteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: inviteUser,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] }),
  });
};

export const useAcceptInvitation = () => {
  return useMutation({
    mutationFn: acceptInvitation,
  });
};

export const useToggleUserActive = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      isActive,
    }: {
      userId: string;
      isActive: boolean;
    }) => toggleUserActive(userId, isActive),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] }),
  });
};

export const useUpdateMyProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMyProfile,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] }),
  });
};

export const useUpdatePreferences = () => {
  return useMutation({
    mutationFn: updatePreferences,
  });
};

export const useUpdateUserTheme = () => {
  return useMutation({
    mutationFn: updateUserTheme,
  });
};

export const useExportGdprData = () => {
  return useMutation({
    mutationFn: exportMyGdprData,
  });
};

export const useDeleteMyAccount = () => {
  return useMutation({
    mutationFn: deleteMyAccount,
  });
};
