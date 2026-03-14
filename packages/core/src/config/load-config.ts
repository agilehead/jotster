import { Environment } from "@tsonic/dotnet/System.js";
import { createServerConfig } from "./server-config.ts";
import type { ServerConfig } from "./server-config.ts";

export function loadConfig(): ServerConfig {
  const mode = Environment.GetEnvironmentVariable("JOTSTER_MODE") ?? "multi-tenant";
  const listenUrl = Environment.GetEnvironmentVariable("JOTSTER_LISTEN_URL") ?? "http://localhost:8080";
  const database = Environment.GetEnvironmentVariable("JOTSTER_DB") ?? "jotster.db";
  const rootToken = Environment.GetEnvironmentVariable("JOTSTER_ROOT_TOKEN") ?? "";
  const singleTenantId = Environment.GetEnvironmentVariable("JOTSTER_SINGLE_TENANT") ?? "";
  const uploadsDir = Environment.GetEnvironmentVariable("JOTSTER_UPLOADS_DIR") ?? "";

  const config = createServerConfig();
  config.mode = mode === "single-tenant" ? "single-tenant" : "multi-tenant";
  config.listenUrl = listenUrl;
  config.database = database;
  config.rootToken = rootToken;
  config.singleTenantId = singleTenantId;
  config.uploadsDir = uploadsDir;
  return config;
}
