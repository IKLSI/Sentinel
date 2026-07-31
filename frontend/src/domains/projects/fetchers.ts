import { ROUTES_API } from "@/configs/api-routes.gen";
import { apiRequest } from "@/domains/helpers";
import { buildUrl } from "@/helpers/url";
import type { Project } from "@/domains/projects/types";

export const fetchProject = (id: string, signal?: AbortSignal) =>
  apiRequest<Project>(
    "GET",
    buildUrl(ROUTES_API.api.techHealth.projects[":id"].__path, { id }),
    { signal },
  );
