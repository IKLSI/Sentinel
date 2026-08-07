import { createFileRoute } from "@tanstack/react-router";
import { UsersPage } from "@/features/users/pages/UsersPage";
import {
  sanitizeUserFiltersSearch,
  type UserFiltersSearch,
} from "@/features/users/pages/UsersPage/filterParams";

export const Route = createFileRoute("/_authenticated/_admin/users")({
  validateSearch: (search: Record<string, unknown>): UserFiltersSearch =>
    sanitizeUserFiltersSearch(search),
  component: UsersPage,
});
