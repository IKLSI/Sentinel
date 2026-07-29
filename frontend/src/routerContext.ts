import type { UserRole } from "@/types/enums";

export interface RouterContext {
  auth: {
    isAuthenticated: boolean;
    loading: boolean;
    role: UserRole | null;
  };
}
