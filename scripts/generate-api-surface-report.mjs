import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

const surfaces = [
  {
    id: "jotster",
    role: "product API",
    file: "packages/api-native/src/index.ts",
    routeFunction: "getNativeApiRoutes",
  },
];

function readSurfaceText(surface) {
  const filePath = path.join(repoRoot, surface.file);
  return fs.readFileSync(filePath, "utf8");
}

function extractStringProperty(text, propertyName) {
  const pattern = new RegExp(`${propertyName}:\\s*"([^"]+)"`);
  const match = pattern.exec(text);
  return match === null ? undefined : match[1];
}

function extractRouteBlock(text, routeFunction) {
  const pattern = new RegExp(`function\\s+${routeFunction}\\(\\):\\s*string\\[\\]\\s*\\{[\\s\\S]*?return\\s*\\[([\\s\\S]*?)\\];[\\s\\S]*?\\}`);
  const match = pattern.exec(text);
  if (match === null) {
    throw new Error(`Could not find ${routeFunction} route block`);
  }
  return match[1];
}

function extractRoutes(text, routeFunction) {
  const block = extractRouteBlock(text, routeFunction);
  return Array.from(block.matchAll(/"([A-Z]+)\s+([^"]+)"/g), (match) => ({
    method: match[1],
    path: match[2],
  }));
}

function summarizeSurface(surface) {
  const text = readSurfaceText(surface);
  const status = extractStringProperty(text, "status");
  const audience = extractStringProperty(text, "audience");
  const basePath = extractStringProperty(text, "basePath");
  const routes = extractRoutes(text, surface.routeFunction);
  if (status !== "contract_ready") {
    throw new Error(`${surface.id} API surface is not contract_ready`);
  }
  if (routes.length === 0) {
    throw new Error(`${surface.id} API surface has no routes`);
  }
  return {
    ...surface,
    status,
    audience,
    basePath,
    routes,
  };
}

function routeCounts(summaries) {
  let total = 0;
  for (let index = 0; index < summaries.length; index++) {
    total += summaries[index].routes.length;
  }
  return total;
}

function printMarkdown(summaries) {
  console.log("# Jotster API Surface Report");
  console.log("");
  console.log("This report inventories the single Jotster-owned API contract from source. Product storage, authorization, notifications, and agent participation all use the same API boundary.");
  console.log("");
  console.log("## Summary");
  console.log("");
  console.log(`- Surfaces: ${summaries.length}`);
  console.log(`- Routes: ${routeCounts(summaries)}`);
  console.log("- Required status: contract_ready");
  console.log("");
  console.log("## Surfaces");
  console.log("");
  console.log("| Surface | Role | Audience | Base path | Status | Routes |");
  console.log("| --- | --- | --- | --- | --- | ---: |");
  for (let index = 0; index < summaries.length; index++) {
    const surface = summaries[index];
    console.log(`| ${surface.id} | ${surface.role} | ${surface.audience ?? ""} | \`${surface.basePath ?? ""}\` | ${surface.status} | ${surface.routes.length} |`);
  }
  console.log("");
  for (let index = 0; index < summaries.length; index++) {
    const surface = summaries[index];
    console.log(`## ${surface.id}`);
    console.log("");
    for (let routeIndex = 0; routeIndex < surface.routes.length; routeIndex++) {
      const route = surface.routes[routeIndex];
      console.log(`- \`${route.method} ${route.path}\``);
    }
    console.log("");
  }
}

const summaries = surfaces.map(summarizeSurface);
printMarkdown(summaries);
