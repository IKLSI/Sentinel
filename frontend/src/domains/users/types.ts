import type { components } from "@/types/api.gen";
import type { SortDirection, UserRole, UserSortField } from "@/enums";

export type User = components["schemas"]["UserDto"];

export type UserList = components["schemas"]["UserListDto"];

export type CreateUser = components["schemas"]["CreateUserDto"];

export type UpdateUser = components["schemas"]["UpdateUserDto"];

export type UpdateMyProfile = components["schemas"]["UpdateMyProfileDto"];

export type UpdatePreferences = components["schemas"]["UpdatePreferencesDto"];

export type AcceptInvitation = components["schemas"]["AcceptInvitationDto"];

export type DeleteAccount = components["schemas"]["DeleteAccountDto"];

export type UserDataExport = components["schemas"]["UserDataExportDto"];

export type UsersFilters = {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: UserRole;
  sortBy?: UserSortField;
  sortDirection?: SortDirection;
};
