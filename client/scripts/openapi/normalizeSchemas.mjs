const SCHEMA_REF_PREFIX = "#/components/schemas/";

function collectRefs(node, found) {
  if (node === null || typeof node !== "object") return;

  if (Array.isArray(node)) {
    for (const item of node) collectRefs(item, found);
    return;
  }

  const ref = node.$ref;
  if (typeof ref === "string" && ref.startsWith(SCHEMA_REF_PREFIX)) {
    found.add(ref.slice(SCHEMA_REF_PREFIX.length));
  }

  for (const value of Object.values(node)) collectRefs(value, found);
}

function expandTransitively(names, schemas) {
  const expanded = new Set(names);
  const queue = [...names];

  while (queue.length > 0) {
    const current = queue.pop();
    const schema = schemas[current];
    if (!schema) continue;

    const nested = new Set();
    collectRefs(schema, nested);

    for (const name of nested) {
      if (expanded.has(name)) continue;
      expanded.add(name);
      queue.push(name);
    }
  }

  return expanded;
}

function collectRequestBodySchemas(document) {
  const direct = new Set();

  for (const pathItem of Object.values(document.paths ?? {})) {
    for (const operation of Object.values(pathItem ?? {})) {
      if (operation === null || typeof operation !== "object") continue;
      if (!operation.requestBody) continue;
      collectRefs(operation.requestBody, direct);
    }
  }

  return expandTransitively(direct, document.components?.schemas ?? {});
}

/**
 * Swashbuckle ne déclare presque aucune propriété comme "required", ce qui rend
 * chaque champ optionnel côté TypeScript alors que .NET sérialise toujours la clé.
 * On marque donc toutes les propriétés des schémas de réponse comme requises,
 * en laissant "nullable" porter l'absence de valeur. Les schémas utilisés en
 * corps de requête restent inchangés pour ne pas imposer d'envoyer tous les champs.
 */
export function markResponseSchemasRequired(document) {
  const requestBodySchemas = collectRequestBodySchemas(document);
  const schemas = document.components?.schemas ?? {};

  for (const [name, schema] of Object.entries(schemas)) {
    if (requestBodySchemas.has(name)) continue;
    if (schema.type !== "object" || !schema.properties) continue;

    schema.required = Object.keys(schema.properties);
  }

  return document;
}
