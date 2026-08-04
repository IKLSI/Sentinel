import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import openapiTS from "openapi-typescript";
import { buildRoutesFile } from "./openapi/buildRoutes.mjs";
import {
  GENERATED_HEADER,
  OPENAPI_URL,
  PROJECT_ROOT,
  ROUTES_OUTPUT,
  TYPES_OUTPUT,
} from "./openapi/config.mjs";
import { markResponseSchemasRequired } from "./openapi/normalizeSchemas.mjs";

const execFileAsync = promisify(execFile);

const BIOME_BINARY = path.join(
  PROJECT_ROOT,
  "node_modules",
  "@biomejs",
  "biome",
  "bin",
  "biome",
);

async function fetchDocument() {
  const response = await fetch(OPENAPI_URL);

  if (!response.ok) {
    throw new Error(
      `Impossible de récupérer le document OpenAPI (${response.status}) sur ${OPENAPI_URL}. Le backend est-il démarré ?`,
    );
  }

  return response.json();
}

async function writeFile(target, contents) {
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, contents, "utf8");
  console.log(`Généré : ${path.relative(process.cwd(), target)}`);
}

async function formatFiles(targets) {
  await execFileAsync(process.execPath, [
    BIOME_BINARY,
    "format",
    "--write",
    ...targets,
  ]);
  console.log("Formaté avec Biome.");
}

async function main() {
  const document = markResponseSchemasRequired(await fetchDocument());

  const types = await openapiTS(document, { alphabetize: true });
  await writeFile(TYPES_OUTPUT, `${GENERATED_HEADER}\n\n${types}`);
  await writeFile(ROUTES_OUTPUT, buildRoutesFile(document));
  await formatFiles([TYPES_OUTPUT, ROUTES_OUTPUT]);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
