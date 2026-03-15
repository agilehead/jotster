import { Environment } from "@tsonic/dotnet/System.js";
import { createServerConfig } from "./server-config.ts";
import type { ServerConfig } from "./server-config.ts";

function parseBooleanEnv(
  value: string | undefined,
  defaultValue: boolean,
): boolean {
  if (value === undefined) {
    return defaultValue;
  }
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "1" ||
    normalized === "true" ||
    normalized === "yes" ||
    normalized === "on"
  ) {
    return true;
  }
  if (
    normalized === "0" ||
    normalized === "false" ||
    normalized === "no" ||
    normalized === "off"
  ) {
    return false;
  }
  return defaultValue;
}

export function loadConfig(): ServerConfig {
  const mode =
    Environment.GetEnvironmentVariable("JOTSTER_MODE") ?? "multi-tenant";
  const production =
    Environment.GetEnvironmentVariable("JOTSTER_PRODUCTION") ?? undefined;
  const devAuthEnabled =
    Environment.GetEnvironmentVariable("JOTSTER_DEV_AUTH_ENABLED") ?? undefined;
  const listenUrl =
    Environment.GetEnvironmentVariable("JOTSTER_LISTEN_URL") ??
    "http://localhost:8080";
  const database =
    Environment.GetEnvironmentVariable("JOTSTER_DB") ?? "jotster.db";
  const rootToken =
    Environment.GetEnvironmentVariable("JOTSTER_ROOT_TOKEN") ?? "";
  const jwtSecret =
    Environment.GetEnvironmentVariable("JOTSTER_JWT_SECRET") ?? "";
  const singleTenantId =
    Environment.GetEnvironmentVariable("JOTSTER_SINGLE_TENANT") ?? "";
  const uploadsDir =
    Environment.GetEnvironmentVariable("JOTSTER_UPLOADS_DIR") ?? "";

  const config = createServerConfig();
  config.mode = mode === "single-tenant" ? "single-tenant" : "multi-tenant";
  config.production = parseBooleanEnv(production, false);
  config.devAuthEnabled = parseBooleanEnv(devAuthEnabled, true);
  config.listenUrl = listenUrl;
  config.database = database;
  config.rootToken = rootToken;
  config.jwtSecret = jwtSecret;
  config.singleTenantId = singleTenantId;
  config.uploadsDir = uploadsDir;
  return config;
}
