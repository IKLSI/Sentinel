import { ROUTES_API } from "@/configs/api-routes.gen";
import { useMutationWrapper, usePostMutation } from "@/domains/helpers";
import type {
  ApiMessageResponse,
  AuthUser,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ResendVerificationRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
} from "@/domains/auth/types";

export const useLoginMutation = () =>
  usePostMutation<LoginResponse, LoginResponse, { data: LoginRequest }>(
    ROUTES_API.api.auth.login.__path,
  );

export const useLogoutMutation = () =>
  usePostMutation<void, void, Record<string, never>>(
    ROUTES_API.api.auth.logout.__path,
  );

export const useMeMutation = () =>
  useMutationWrapper<AuthUser, AuthUser, Record<string, never>>(
    "GET",
    ROUTES_API.api.auth.me.__path,
  );

export const useForgotPasswordMutation = () =>
  usePostMutation<
    ApiMessageResponse,
    ApiMessageResponse,
    { data: ForgotPasswordRequest }
  >(ROUTES_API.api.auth.forgotPassword.__path);

export const useResetPasswordMutation = () =>
  usePostMutation<
    ApiMessageResponse,
    ApiMessageResponse,
    { data: ResetPasswordRequest }
  >(ROUTES_API.api.auth.resetPassword.__path);

export const useRegisterMutation = () =>
  usePostMutation<
    ApiMessageResponse,
    ApiMessageResponse,
    { data: RegisterRequest }
  >(ROUTES_API.api.auth.register.__path);

export const useVerifyEmailMutation = () =>
  usePostMutation<
    ApiMessageResponse,
    ApiMessageResponse,
    { data: VerifyEmailRequest }
  >(ROUTES_API.api.auth.verifyEmail.__path);

export const useResendVerificationMutation = () =>
  usePostMutation<
    ApiMessageResponse,
    ApiMessageResponse,
    { data: ResendVerificationRequest }
  >(ROUTES_API.api.auth.resendVerification.__path);
