import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/features/users/pages/ProfilePage";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});
