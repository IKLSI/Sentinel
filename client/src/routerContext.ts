import type { UserRole } from "@/enums";

export interface RouterContext {
  auth: {
    isAuthenticated: boolean;
    loading: boolean;
    role: UserRole | null;
  };
}
