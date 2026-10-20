import { UserRole } from "@/enums";
import { useAuth } from "@/hooks/useAuth";

export const useIsAdmin = (): boolean =>
  useAuth().user?.role === UserRole.Admin;
