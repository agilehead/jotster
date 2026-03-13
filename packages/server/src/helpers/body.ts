import type { int } from "@tsonic/core/types.js";
import type { Request } from "@tsonic/express/index.js";
import { Convert } from "@tsonic/dotnet/System.js";

export const getBodyObject = (req: Request): Record<string, unknown> => {
  const body = req.body;
  if (body === undefined || body === null || typeof body !== "object" || Array.isArray(body)) {
    return {};
  }
  return body as Record<string, unknown>;
};

export const toOptionalInt = (value: unknown): int | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return undefined;
    }
    return Convert.ToInt32(value);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return undefined;
    }
    const parsed = parseInt(trimmed, 10);
    if (Number.isNaN(parsed)) {
      return undefined;
    }
    return Convert.ToInt32(parsed);
  }
  return undefined;
};

export const toOptionalFlagInt = (value: unknown): int | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (value === true || value === "true" || value === 1 || value === "1") {
    return 1 as int;
  }
  if (value === false || value === "false" || value === 0 || value === "0") {
    return 0 as int;
  }
  return undefined;
};

export const getOptionalIntField = (body: Record<string, unknown>, key: string): int | undefined => {
  return toOptionalInt(body[key]);
};

export const getOptionalFlagIntField = (body: Record<string, unknown>, key: string): int | undefined => {
  return toOptionalFlagInt(body[key]);
};
