import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

export const PROJECT_ROOT = path.resolve(scriptDir, "..", "..");

export const OPENAPI_URL =
  process.env.OPENAPI_URL ?? "http://localhost:5000/swagger/v1/swagger.json";

export const TYPES_OUTPUT = path.join(
  PROJECT_ROOT,
  "src",
  "types",
  "api.gen.ts",
);

export const ROUTES_OUTPUT = path.join(
  PROJECT_ROOT,
  "src",
  "configs",
  "api-routes.gen.ts",
);

export const PATH_PARAM_PATTERN = /^\{(.+)\}$/;

export const KEBAB_SEGMENT_PATTERN = /-([a-z0-9])/g;

export const GENERATED_HEADER = `/**
 * Fichier généré automatiquement par "pnpm generate:api".
 * Ne pas modifier à la main.
 */`;
