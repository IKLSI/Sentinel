import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

const REPOSITORY_ROOT = path.resolve(scriptDir, "..", "..");

const RESOURCES_SOURCE = path.join(
  REPOSITORY_ROOT,
  "server/src/Domain/Constants/RealtimeResources.cs",
);

const CONSTANTS_SOURCE = path.join(
  REPOSITORY_ROOT,
  "server/src/Domain/Constants/RealtimeConstants.cs",
);

const OUTPUT = path.join(
  scriptDir,
  "..",
  "src/domains/realtime/contract.gen.ts",
);

const CONST_PATTERN = /public\s+const\s+string\s+(\w+)\s*=\s*"([^"]*)"\s*;/g;

const SHARED_CONSTANTS = [
  { csharp: "HubPath", typescript: "REALTIME_HUB_PATH" },
  { csharp: "InvalidateMethod", typescript: "REALTIME_INVALIDATE_METHOD" },
];

const GENERATED_HEADER = `/**
 * Fichier généré automatiquement par "pnpm generate:realtime".
 * Source : server/src/Domain/Constants/Realtime{Constants,Resources}.cs
 * Ne pas modifier à la main.
 */`;

async function readConstants(source) {
  const contents = await fs.readFile(source, "utf8");
  const entries = [...contents.matchAll(CONST_PATTERN)].map(
    ([, name, value]) => [name, value],
  );

  if (entries.length === 0)
    throw new Error(
      `Aucune constante trouvée dans ${path.relative(REPOSITORY_ROOT, source)}. Le format du fichier a-t-il changé ?`,
    );

  return Object.fromEntries(entries);
}

function buildFile(resources, constants) {
  const shared = SHARED_CONSTANTS.map(({ csharp, typescript }) => {
    const value = constants[csharp];

    if (value === undefined)
      throw new Error(
        `RealtimeConstants.${csharp} est introuvable : le contrat du hub ne peut pas être généré.`,
      );

    return `export const ${typescript} = ${JSON.stringify(value)};`;
  }).join("\n\n");

  const members = Object.entries(resources)
    .map(([name, value]) => `  ${name}: ${JSON.stringify(value)},`)
    .join("\n");

  return `${GENERATED_HEADER}

${shared}

export const REALTIME_RESOURCES = {
${members}
} as const;

export type RealtimeResource =
  (typeof REALTIME_RESOURCES)[keyof typeof REALTIME_RESOURCES];
`;
}

async function main() {
  const resources = await readConstants(RESOURCES_SOURCE);
  const constants = await readConstants(CONSTANTS_SOURCE);

  await fs.writeFile(OUTPUT, buildFile(resources, constants), "utf8");

  console.log(
    `Généré : ${path.relative(process.cwd(), OUTPUT)} (${Object.keys(resources).length} ressources)`,
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
