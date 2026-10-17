import { useMutation } from "@tanstack/react-query";
import { ROUTES_API } from "@/configs/api-routes.gen";
import { MIME_TYPES, downloadFile } from "@/helpers/download";
import {
  useDeleteMutation,
  usePatchMutation,
  usePostMutation,
  usePutMutation,
} from "@/domains/helpers";
import { GDPR_EXPORT_FALLBACK_FILE } from "@/domains/users/constants";
import type {
  AcceptInvitation,
  CreateUser,
  DeleteAccount,
  UpdateMyProfile,
  UpdatePreferences,
  UpdateUser,
  User,
} from "@/domains/users/types";
import type { ApiMessageResponse } from "@/domains/auth/types";

export const useInviteUserMutation = () =>
  usePostMutation<ApiMessageResponse, ApiMessageResponse, { data: CreateUser }>(
    ROUTES_API.api.users.__path,
  );

export const useAcceptInvitationMutation = () =>
  usePostMutation<
    ApiMessageResponse,
    ApiMessageResponse,
    { data: AcceptInvitation }
  >(ROUTES_API.api.users.acceptInvitation.__path);

export const useUpdateUserMutation = () =>
  usePutMutation<User, User, { id: string; data: UpdateUser }>(
    ROUTES_API.api.users[":id"].__path,
  );

export const useUpdateMyProfileMutation = () =>
  usePatchMutation<User, User, { data: UpdateMyProfile }>(
    ROUTES_API.api.users.me.__path,
  );

export const useUpdatePreferencesMutation = () =>
  usePatchMutation<void, void, { data: UpdatePreferences }>(
    ROUTES_API.api.users.me.preferences.__path,
  );

export const useDeleteMyAccountMutation = () =>
  useDeleteMutation<void, void, { data: DeleteAccount }>(
    ROUTES_API.api.users.me.__path,
  );

export const useExportMyDataMutation = () =>
  useMutation({
    mutationFn: () =>
      downloadFile(
        ROUTES_API.api.users.me.export.__path,
        GDPR_EXPORT_FALLBACK_FILE,
        MIME_TYPES.ZIP,
      ),
  });
