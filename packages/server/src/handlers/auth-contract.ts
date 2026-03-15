import type { int } from "@tsonic/core/types.js";
import type { ServerConfig } from "@jotster/core/Jotster.Core.js";

export const INVALID_EMAIL_MSG = "Enter a valid email address.";
export const INVALID_CREDENTIALS_MSG = "Your username or password is incorrect";
export const ACCOUNT_DEACTIVATED_MSG = "Account is deactivated";
export const INVALID_SUBDOMAIN_MSG = "Invalid subdomain";
export const ORGANIZATION_DEACTIVATED_MSG =
  "This organization has been deactivated";
export const JWT_NOT_ENABLED_MSG =
  "JWT authentication is not enabled for this organization";
export const JWT_MISSING_MSG = "No JSON web token passed in request";
export const JWT_BAD_MSG = "Bad JSON web token";
export const JWT_NO_EMAIL_MSG = "No email specified in JSON web token claims";
export const DEV_AUTH_DISABLED_MSG = "DevAuthBackend not enabled.";
export const DEV_AUTH_PRODUCTION_MSG = "Endpoint not available in production.";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidLoginEmail = (value: string): boolean => {
  return emailPattern.test(value.trim());
};

export const getTenantAuthErrorStatus = (message: string): int => {
  if (message === INVALID_SUBDOMAIN_MSG) {
    return 404 as int;
  }
  if (message === ORGANIZATION_DEACTIVATED_MSG) {
    return 401 as int;
  }
  return 400 as int;
};

export const getPasswordAuthErrorStatus = (message: string): int => {
  if (
    message === INVALID_CREDENTIALS_MSG ||
    message === ACCOUNT_DEACTIVATED_MSG ||
    message === ORGANIZATION_DEACTIVATED_MSG
  ) {
    return 401 as int;
  }
  if (message === INVALID_SUBDOMAIN_MSG) {
    return 404 as int;
  }
  return 400 as int;
};

export const getJwtAuthErrorStatus = (message: string): int => {
  if (message === INVALID_SUBDOMAIN_MSG) {
    return 404 as int;
  }
  if (
    message === INVALID_CREDENTIALS_MSG ||
    message === ACCOUNT_DEACTIVATED_MSG ||
    message === ORGANIZATION_DEACTIVATED_MSG
  ) {
    return 401 as int;
  }
  return 400 as int;
};

export const getJsonErrorBody = (message: string): Record<string, unknown> => {
  return { result: "error", msg: message };
};

export const getDevAuthAvailabilityError = (
  config: ServerConfig,
): string | undefined => {
  if (config.production) {
    return DEV_AUTH_PRODUCTION_MSG;
  }
  if (!config.devAuthEnabled) {
    return DEV_AUTH_DISABLED_MSG;
  }
  return undefined;
};
