#!/usr/bin/env node
// Reads openapi.json and emits a human- and agent-readable reference at
// packages/cli/skills/join/SCHEMA.md: every command with its request and
// response type, then every schema with its fields.
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { endpoints, spec } from "./endpoints.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(__dirname, "..", "skills", "join", "SCHEMA.md");
const schemas = spec.components?.schemas ?? {};
const refName = (ref) => ref.replace(/^#\/components\/schemas\//, "");
const slug = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const escapePipe = (s) => s.replace(/([\\|])/g, "\\$1");

function typeLabel(prop) {
  if (!prop) return "unknown";
  if (prop.$ref) return `[${refName(prop.$ref)}](#${slug(refName(prop.$ref))})`;
  for (const key of ["allOf", "oneOf", "anyOf"]) {
    if (prop[key])
      return prop[key].map(typeLabel).join(key === "allOf" ? " & " : " or ");
  }
  if (prop.type === "array") return `${typeLabel(prop.items)}[]`;
  if (prop.enum) return prop.enum.map((e) => `\`${e}\``).join(" or ");
  if (prop.type === "object" && prop.properties) {
    return `{ ${Object.keys(prop.properties).join(", ")} }`;
  }
  const base = prop.format
    ? `${prop.type} (${prop.format})`
    : (prop.type ?? "unknown");
  return prop.nullable ? `${base} or null` : base;
}

function flatten(schema, seen = new Set()) {
  if (!schema) return { properties: {}, required: [] };
  if (schema.$ref) {
    if (seen.has(schema.$ref)) return { properties: {}, required: [] };
    seen.add(schema.$ref);
    return flatten(schemas[refName(schema.$ref)], seen);
  }
  if (schema.allOf) {
    const parts = schema.allOf.map((p) => flatten(p, new Set(seen)));
    return {
      properties: Object.assign({}, ...parts.map((p) => p.properties)),
      required: [...new Set(parts.flatMap((p) => p.required))],
    };
  }
  return {
    properties: schema.properties ?? {},
    required: schema.required ?? [],
  };
}

function renderFields(schema) {
  const { properties, required } = flatten(schema);
  const keys = Object.keys(properties);
  if (keys.length === 0) return `${escapePipe(typeLabel(schema))}\n`;
  const lines = [
    "| field | type | required | description |",
    "|---|---|---|---|",
  ];
  for (const key of keys) {
    const prop = properties[key];
    const desc = (prop.description ?? "").replace(/\s+/g, " ").trim();
    lines.push(
      `| \`${key}\` | ${escapePipe(typeLabel(prop))} | ${required.includes(key) ? "yes" : ""} | ${escapePipe(desc)} |`,
    );
  }
  return lines.join("\n") + "\n";
}

function bodySchema(op) {
  return op.requestBody?.content?.["application/json"]?.schema;
}

function responseSchema(op) {
  const [, res] =
    Object.entries(op.responses ?? {}).find(([code]) => code.startsWith("2")) ??
    [];
  const content = res?.content ?? {};
  const json = content["application/json"]?.schema;
  if (json) return typeLabel(json);
  const types = Object.keys(content);
  return types.length ? `binary (${types.join(", ")})` : "none";
}

const out = [];
out.push("# JOIN API: command and field reference\n");
out.push(
  `Auto-generated from \`openapi.json\` (JOIN API **${spec.info?.version ?? "?"}**). Do not hand-edit.\n`,
);
out.push(
  "Responses wrap the payload under `data`. Paginated list endpoints return `{ data, nextCursor }`; pass `nextCursor` back with `--cursor`, or use `--all` to fetch every page as one array. Errors return `{ error: { code, message, details? } }`.\n",
);

out.push("## Commands\n");
out.push("| CLI | Endpoint | Request body | Response |");
out.push("|---|---|---|---|");
const eps = endpoints().toSorted((a, b) =>
  `${a.resource} ${a.command}`.localeCompare(`${b.resource} ${b.command}`),
);
for (const ep of eps) {
  const body = bodySchema(ep.op);
  const bodyCell = body ? escapePipe(typeLabel(body)) : "";
  out.push(
    `| \`join-com ${ep.resource} ${ep.command}\` | \`${ep.method} ${ep.path}\` | ${bodyCell} | ${escapePipe(responseSchema(ep.op))} |`,
  );
}
out.push("");

const inlineBodies = eps.filter((ep) => {
  const body = bodySchema(ep.op);
  return body && !body.$ref;
});
if (inlineBodies.length) {
  out.push("## Inline request bodies\n");
  for (const ep of inlineBodies) {
    out.push(`### \`join-com ${ep.resource} ${ep.command}\`\n`);
    out.push(renderFields(bodySchema(ep.op)));
  }
}

out.push("## Schemas\n");
const names = Object.keys(schemas).toSorted();
for (const name of names) {
  out.push(`### ${name}\n`);
  out.push(renderFields(schemas[name]));
}

writeFileSync(outPath, out.join("\n"), "utf8");
console.log(
  `wrote ${outPath} (${names.length} schemas, ${eps.length} commands)`,
);
