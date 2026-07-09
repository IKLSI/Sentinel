import apiClient from "../../../services/client";
import type { User, UserRole, PaginatedResponse } from "../../../types";

export const getUsers = async (
  params: { page?: number; role?: UserRole; search?: string } = {},
  signal?: AbortSignal,
): Promise<PaginatedResponse<User>> => {
  const response = await apiClient.get<PaginatedResponse<User>>("/api/users", {
    params,
    signal,
  });
  return response.data;
};

export const updateUserTheme = async (
  theme: "dark" | "light",
): Promise<void> => {
  await apiClient.patch("/api/users/me/preferences", { theme });
};

export const updatePreferences = async (data: {
  theme?: "dark" | "light";
  language?: "fr-FR" | "en-US";
}): Promise<void> => {
  await apiClient.patch("/api/users/me/preferences", data);
};

export const updateMyProfile = async (data: {
  firstName?: string;
  lastName?: string;
}): Promise<User> => {
  const response = await apiClient.patch<User>("/api/users/me", data);
  return response.data;
};

export const inviteUser = async (data: {
  email: string;
  role: UserRole;
}): Promise<void> => {
  await apiClient.post("/api/users", data);
};

export const acceptInvitation = async (data: {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
}): Promise<void> => {
  await apiClient.post("/api/users/accept-invitation", data);
};

export const toggleUserActive = async (
  userId: string,
  isActive: boolean,
): Promise<User> => {
  const response = await apiClient.put<User>(`/api/users/${userId}`, {
    isActive,
  });
  return response.data;
};

export const exportMyGdprData = async (): Promise<object> => {
  const response = await apiClient.get<object>("/api/users/me/export");
  return response.data;
};

export const deleteMyAccount = async (password: string): Promise<void> => {
  await apiClient.delete("/api/users/me", { data: { password } });
};
