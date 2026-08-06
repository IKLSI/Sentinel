import type { components } from "@/types/api.gen";

export type AuthUser = components["schemas"]["UserProfile"];

export type LoginRequest = components["schemas"]["LoginRequest"];

export type LoginResponse = components["schemas"]["LoginResponse"];

export type ForgotPasswordRequest =
  components["schemas"]["ForgotPasswordRequest"];

export type ResetPasswordRequest =
  components["schemas"]["ResetPasswordRequest"];

export type RegisterRequest = components["schemas"]["RegisterRequest"];

export type VerifyEmailRequest = components["schemas"]["VerifyEmailRequest"];

export type ResendVerificationRequest =
  components["schemas"]["ResendVerificationRequest"];

export type ApiMessageResponse = components["schemas"]["ApiMessageResponse"];
