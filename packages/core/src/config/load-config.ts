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

function parseNumberEnv(
  value: string | undefined,
  defaultValue: number,
): number {
  if (value === undefined) {
    return defaultValue;
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return defaultValue;
  }
  return parsed;
}

function requireProductionSetting(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

export function validateConfig(config: ServerConfig): void {
  if (!config.production) {
    return;
  }

  requireProductionSetting(
    config.environment === "production",
    "JOTSTER_ENVIRONMENT must be production when JOTSTER_PRODUCTION is true",
  );
  requireProductionSetting(
    !config.devAuthEnabled,
    "JOTSTER_DEV_AUTH_ENABLED must be false in production",
  );
  requireProductionSetting(
    config.jwtSecret.length >= 32,
    "JOTSTER_JWT_SECRET must be at least 32 characters in production",
  );
  requireProductionSetting(
    config.rootToken.length === 0 || config.rootToken.length >= 32,
    "JOTSTER_ROOT_TOKEN must be empty or at least 32 characters in production",
  );
  requireProductionSetting(
    config.uploadsDir.length > 0,
    "JOTSTER_UPLOADS_DIR must be set in production",
  );
  requireProductionSetting(
    config.listenUrl.startsWith("https://") || config.behindTrustedTlsProxy,
    "JOTSTER_LISTEN_URL must be HTTPS unless JOTSTER_BEHIND_TRUSTED_TLS_PROXY is true",
  );
}

export function loadConfig(): ServerConfig {
  const environment =
    Environment.GetEnvironmentVariable("JOTSTER_ENVIRONMENT") ?? "development";
  const mode =
    Environment.GetEnvironmentVariable("JOTSTER_MODE") ?? "domain-routed";
  const production =
    Environment.GetEnvironmentVariable("JOTSTER_PRODUCTION") ?? undefined;
  const devAuthEnabled =
    Environment.GetEnvironmentVariable("JOTSTER_DEV_AUTH_ENABLED") ?? undefined;
  const behindTrustedTlsProxy =
    Environment.GetEnvironmentVariable("JOTSTER_BEHIND_TRUSTED_TLS_PROXY") ?? undefined;
  const listenUrl =
    Environment.GetEnvironmentVariable("JOTSTER_LISTEN_URL") ??
    "http://localhost:8080";
  const database =
    Environment.GetEnvironmentVariable("JOTSTER_DB") ?? "jotster.db";
  const rootToken =
    Environment.GetEnvironmentVariable("JOTSTER_ROOT_TOKEN") ?? "";
  const jwtSecret =
    Environment.GetEnvironmentVariable("JOTSTER_JWT_SECRET") ?? "";
  const defaultWorkspaceId =
    Environment.GetEnvironmentVariable("JOTSTER_DEFAULT_WORKSPACE") ?? "";
  const uploadsDir =
    Environment.GetEnvironmentVariable("JOTSTER_UPLOADS_DIR") ?? "";
  const maxJsonBodyBytes =
    Environment.GetEnvironmentVariable("JOTSTER_MAX_JSON_BODY_BYTES") ?? undefined;

  const config = createServerConfig();
  config.environment = environment;
  config.mode = mode === "single-workspace" ? "single-workspace" : "domain-routed";
  config.production = parseBooleanEnv(production, false);
  config.devAuthEnabled = parseBooleanEnv(devAuthEnabled, true);
  config.behindTrustedTlsProxy = parseBooleanEnv(behindTrustedTlsProxy, false);
  config.listenUrl = listenUrl;
  config.database = database;
  config.rootToken = rootToken;
  config.jwtSecret = jwtSecret;
  config.defaultWorkspaceId = defaultWorkspaceId;
  config.uploadsDir = uploadsDir;
  config.maxJsonBodyBytes = parseNumberEnv(maxJsonBodyBytes, 1048576);
  validateConfig(config);
  return config;
}
