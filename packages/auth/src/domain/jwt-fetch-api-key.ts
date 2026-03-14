import type { byte } from "@tsonic/core/types.js";
import { Encoding } from "@tsonic/dotnet/System.Text.js";
import { HMACSHA256 } from "@tsonic/dotnet/System.Security.Cryptography.js";
import { Convert, DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, ServerConfig, User } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { getUserByEmail } from "../repo/get-user-by-email.ts";
import { revokeAllApiKeys } from "../repo/revoke-all-api-keys.ts";
import { generateApiKey } from "../crypto/generate-api-key.ts";
import { hashApiKey } from "../crypto/hash-api-key.ts";
import { createApiKey } from "../repo/create-api-key.ts";

type JwtPayload = {
  email?: string;
  exp?: number;
};

const getObjectField = (value: unknown, key: string): unknown => {
  if (value === null || value === undefined || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  for (const [entryKey, entryValue] of Object.entries(value)) {
    if (entryKey === key) {
      return entryValue;
    }
  }
  return undefined;
};

const normalizeBase64Url = (segment: string): string => {
  let normalized = segment.split("-").join("+").split("_").join("/");
  const remainder = normalized.length % 4;
  if (remainder === 2) {
    normalized += "==";
  } else if (remainder === 3) {
    normalized += "=";
  } else if (remainder === 1) {
    return "";
  }
  return normalized;
};

const decodeBase64UrlBytes = (segment: string): byte[] | undefined => {
  const normalized = normalizeBase64Url(segment);
  if (normalized.length === 0) {
    return undefined;
  }
  try {
    return Convert.FromBase64String(normalized) as byte[];
  } catch {
    return undefined;
  }
};

const bytesEqual = (left: byte[], right: byte[]): boolean => {
  if (left.length !== right.length) {
    return false;
  }
  for (let i = 0; i < left.length; i++) {
    if (left[i] !== right[i]) {
      return false;
    }
  }
  return true;
};

const decodeJsonSegment = (segment: string): unknown => {
  try {
    const bytes = decodeBase64UrlBytes(segment);
    if (bytes === undefined) {
      return undefined;
    }
    const json = Encoding.UTF8.GetString(bytes);
    const parsed = JSON.parse(json) as unknown;
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return undefined;
    }
    return parsed;
  } catch {
    return undefined;
  }
};

const verifyJwt = (token: string, secret: string): JwtPayload | undefined => {
  const segments = token.split(".");
  if (segments.length !== 3) {
    return undefined;
  }

  const [headerSegment, payloadSegment, signatureSegment] = segments;
  const header = decodeJsonSegment(headerSegment);
  if (header === undefined || getObjectField(header, "alg") !== "HS256") {
    return undefined;
  }

  const payloadObject = decodeJsonSegment(payloadSegment);
  if (payloadObject === undefined) {
    return undefined;
  }

  try {
    const secretBytes = Encoding.UTF8.GetBytes(secret);
    const signingInputBytes = Encoding.UTF8.GetBytes(`${headerSegment}.${payloadSegment}`);
    const expectedSignature = HMACSHA256.HashData(secretBytes, signingInputBytes);
    const actualSignature = decodeBase64UrlBytes(signatureSegment);
    if (actualSignature === undefined || !bytesEqual(expectedSignature, actualSignature)) {
      return undefined;
    }
  } catch {
    return undefined;
  }

  const expValue = getObjectField(payloadObject, "exp");
  const exp = typeof expValue === "number" ? (expValue as number) : undefined;
  if (exp !== undefined) {
    const nowSeconds = Number(DateTimeOffset.UtcNow.ToUnixTimeSeconds());
    if (exp < nowSeconds) {
      return undefined;
    }
  }

  const payload: JwtPayload = {};
  const emailValue = getObjectField(payloadObject, "email");
  if (typeof emailValue === "string") {
    payload.email = emailValue;
  }
  if (exp !== undefined) {
    payload.exp = exp as number;
  }
  return payload;
};

export const fetchJwtApiKey = async (
  options: DbContextOptions,
  config: ServerConfig,
  tenantId: string,
  token: string,
  includeProfile: boolean,
): Promise<Result<{ api_key: string; email: string; user_id: string; user?: User }, string>> => {
  if (config.jwtSecret.trim().length === 0) {
    return err("JWT authentication is not configured");
  }

  const payload = verifyJwt(token, config.jwtSecret);
  if (payload === undefined || typeof payload.email !== "string" || payload.email.trim().length === 0) {
    return err("Invalid JWT");
  }

  const user = await getUserByEmail(options, tenantId, payload.email.trim());
  if (user === undefined || user.IsActive !== 1) {
    return err("User not found or inactive");
  }

  await revokeAllApiKeys(options, tenantId, user.Id);

  const rawKey = generateApiKey();
  const keyHash = hashApiKey(rawKey);
  await createApiKey(options, tenantId, user.Id, keyHash, rawKey);

  return ok({
    api_key: rawKey,
    email: user.Email,
    user_id: user.Id,
    user: includeProfile ? user : undefined,
  });
};
