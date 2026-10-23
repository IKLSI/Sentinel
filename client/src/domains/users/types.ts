import type { components } from "@/types/api.gen";
import type { SortDirection, UserSortField } from "@/enums";

export type User = components["schemas"]["UserDto"];

export type UserList = components["schemas"]["UserListDto"];

export type UserOption = components["schemas"]["UserOptionDto"];

export type CreateUser = components["schemas"]["CreateUserDto"];

export type UpdateUser = components["schemas"]["UpdateUserDto"];

export type UpdateMyProfile = components["schemas"]["UpdateMyProfileDto"];

export type UpdatePreferences = components["schemas"]["UpdatePreferencesDto"];

export type AcceptInvitation = components["schemas"]["AcceptInvitationDto"];

export type DeleteAccount = components["schemas"]["DeleteAccountDto"];

export type UserCriteriaFilters = {
  role?: string[];
  status?: string[];
  search?: string;
};

export type UsersFilters = UserCriteriaFilters & {
  page?: number;
  pageSize?: number;
  sortBy?: UserSortField;
  sortDirection?: SortDirection;
};
