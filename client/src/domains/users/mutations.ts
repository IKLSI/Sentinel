import { ROUTES_API } from "@/configs/api-routes.gen";
import {
  invalidateKeys,
  useDeleteMutation,
  useMutationWrapper,
  usePatchMutation,
  usePostMutation,
  usePutMutation,
} from "@/domains/helpers";
import { USERS_QUERY_KEY } from "@/domains/users/constants";
import type {
  AcceptInvitation,
  CreateUser,
  DeleteAccount,
  UpdateMyProfile,
  UpdatePreferences,
  UpdateUser,
  User,
  UserDataExport,
} from "@/domains/users/types";
import type { ApiMessageResponse } from "@/domains/auth/types";

const invalidateUsers = () => invalidateKeys([[USERS_QUERY_KEY]]);

export const useInviteUserMutation = () =>
  usePostMutation<ApiMessageResponse, ApiMessageResponse, { data: CreateUser }>(
    ROUTES_API.api.users.__path,
    { onSuccess: invalidateUsers },
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
    { onSuccess: invalidateUsers },
  );

export const useUpdateMyProfileMutation = () =>
  usePatchMutation<User, User, { data: UpdateMyProfile }>(
    ROUTES_API.api.users.me.__path,
    { onSuccess: invalidateUsers },
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
  useMutationWrapper<UserDataExport, UserDataExport, Record<string, never>>(
    "GET",
    ROUTES_API.api.users.me.export.__path,
  );
