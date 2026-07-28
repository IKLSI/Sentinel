import { useMutation } from "@tanstack/react-query";
import {
  login,
  logout,
  me,
  forgotPassword,
  resetPassword,
  register,
  verifyEmail,
  resendVerification,
  type RegisterPayload,
} from "../api/auth";

export const useLoginMutation = () => {
  return useMutation({
    mutationFn: ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => login(email, password),
  });
};

export const useLogoutMutation = () => {
  return useMutation({
    mutationFn: logout,
  });
};

export const useMeMutation = () => {
  return useMutation({
    mutationFn: me,
  });
};

export const useForgotPasswordMutation = () => {
  return useMutation({
    mutationFn: forgotPassword,
  });
};

export const useResetPasswordMutation = () => {
  return useMutation({
    mutationFn: ({
      token,
      password,
    }: {
      token: string;
      password: string;
    }) => resetPassword(token, password),
  });
};

export const useRegisterMutation = () => {
  return useMutation({
    mutationFn: (payload: RegisterPayload) => register(payload),
  });
};

export const useVerifyEmailMutation = () => {
  return useMutation({
    mutationFn: verifyEmail,
  });
};

export const useResendVerificationMutation = () => {
  return useMutation({
    mutationFn: resendVerification,
  });
};
