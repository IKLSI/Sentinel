import fs from "node:fs/promises";
import path from "node:path";
import openapiTS from "openapi-typescript";
import { buildRoutesFile } from "./openapi/buildRoutes.mjs";
import {
  GENERATED_HEADER,
  OPENAPI_URL,
  ROUTES_OUTPUT,
  TYPES_OUTPUT,
} from "./openapi/config.mjs";
import { markResponseSchemasRequired } from "./openapi/normalizeSchemas.mjs";

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

async function main() {
  const document = markResponseSchemasRequired(await fetchDocument());

  const types = await openapiTS(document, { alphabetize: true });
  await writeFile(TYPES_OUTPUT, `${GENERATED_HEADER}\n\n${types}`);
  await writeFile(ROUTES_OUTPUT, buildRoutesFile(document));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
