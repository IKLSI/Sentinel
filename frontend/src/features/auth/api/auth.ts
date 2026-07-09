import apiClient from "../../../services/client";
import type { LoginResponse, User } from "../../../types";
import { API_ROUTES } from "@/constants/api";

export const login = async (
  email: string,
  password: string,
): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>(API_ROUTES.auth.login, {
    email,
    password,
  });
  return response.data;
};

export const logout = async (): Promise<void> => {
  await apiClient.post(API_ROUTES.auth.logout);
};

export const me = async (): Promise<User> => {
  const response = await apiClient.get<User>(API_ROUTES.auth.me);
  return response.data;
};

export const forgotPassword = async (email: string): Promise<void> => {
  await apiClient.post(API_ROUTES.auth.forgotPassword, { email });
};

export const resetPassword = async (
  token: string,
  password: string,
): Promise<void> => {
  await apiClient.post(API_ROUTES.auth.resetPassword, { token, password });
};

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
}

export const register = async (payload: RegisterPayload): Promise<void> => {
  await apiClient.post(API_ROUTES.auth.register, payload);
};

export const verifyEmail = async (token: string): Promise<void> => {
  await apiClient.post(API_ROUTES.auth.verifyEmail, { token });
};

export const resendVerification = async (email: string): Promise<void> => {
  await apiClient.post(API_ROUTES.auth.resendVerification, { email });
};
