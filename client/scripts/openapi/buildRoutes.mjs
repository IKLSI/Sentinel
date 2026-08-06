import {
  GENERATED_HEADER,
  KEBAB_SEGMENT_PATTERN,
  PATH_PARAM_PATTERN,
} from "./config.mjs";

const PATH_KEY = "__path";
const INDENT_UNIT = "  ";
const IDENTIFIER_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

function toCamelCase(segment) {
  return segment.replace(KEBAB_SEGMENT_PATTERN, (_, char) =>
    char.toUpperCase(),
  );
}

function toRouteKey(segment) {
  const parameter = segment.match(PATH_PARAM_PATTERN);
  if (parameter) return `:${parameter[1]}`;
  return toCamelCase(segment);
}

function toRouteSegment(segment) {
  const parameter = segment.match(PATH_PARAM_PATTERN);
  if (parameter) return `:${parameter[1]}`;
  return segment;
}

function buildRouteTree(paths) {
  const tree = {};

  for (const rawPath of Object.keys(paths).sort()) {
    const segments = rawPath.split("/").filter(Boolean);
    let node = tree;
    let currentPath = "";

    for (const segment of segments) {
      currentPath += `/${toRouteSegment(segment)}`;
      const key = toRouteKey(segment);
      node[key] ??= {};
      node = node[key];
      node[PATH_KEY] = currentPath;
    }
  }

  return tree;
}

function formatKey(key) {
  return IDENTIFIER_PATTERN.test(key) ? key : `"${key}"`;
}

function serializeNode(node, depth) {
  const indent = INDENT_UNIT.repeat(depth);
  const childIndent = INDENT_UNIT.repeat(depth + 1);

  const lines = Object.entries(node).map(([key, value]) => {
    if (key === PATH_KEY) return `${childIndent}${PATH_KEY}: "${value}",`;
    return `${childIndent}${formatKey(key)}: ${serializeNode(value, depth + 1)},`;
  });

  return `{\n${lines.join("\n")}\n${indent}}`;
}

export function buildRoutesFile(document) {
  const tree = buildRouteTree(document.paths ?? {});

  return `${GENERATED_HEADER}

export const ROUTES_API = ${serializeNode(tree, 0)} as const;
`;
}
