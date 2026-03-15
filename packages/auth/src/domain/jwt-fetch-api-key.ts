import type { long } from "@tsonic/core/types.js";
import { DateTimeOffset, Convert } from "@tsonic/dotnet/System.js";
import { Encoding } from "@tsonic/dotnet/System.Text.js";
import { HMACSHA256 } from "@tsonic/dotnet/System.Security.Cryptography.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, ServerConfig, User } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { getUserByEmail } from "../repo/get-user-by-email.ts";
import { generateApiKey } from "../crypto/generate-api-key.ts";
import { hashApiKey } from "../crypto/hash-api-key.ts";
import { createApiKey } from "../repo/create-api-key.ts";
import { getActiveApiKey } from "../repo/get-active-api-key.ts";

export type JwtPayload = {
  email?: string;
  exp?: number;
};

type JwtVerificationResult =
  | { success: true; payload: JwtPayload }
  | {
      success: false;
      error: "segments" | "header" | "payload" | "signature" | "expired";
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

const getObjectField = (value: unknown, key: string): unknown => {
  if (
    value === null ||
    value === undefined ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return undefined;
  }
  for (const [entryKey, entryValue] of Object.entries(value)) {
    if (entryKey === key) {
      return entryValue;
    }
  }
  return undefined;
};

const decodeJsonSegment = (segment: string): unknown => {
  try {
    const normalized = normalizeBase64Url(segment);
    if (normalized.length === 0) {
      return undefined;
    }
    const json = Encoding.UTF8.GetString(Convert.FromBase64String(normalized));
    const parsed = JSON.parse(json) as unknown;
    if (
      parsed === null ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return undefined;
    }
    return parsed;
  } catch {
    return undefined;
  }
};

const verifyJwt = (token: string, secret: string): JwtVerificationResult => {
  const segments = token.split(".");
  if (segments.length !== 3) {
    return { success: false, error: "segments" };
  }

  const [headerSegment, payloadSegment, signatureSegment] = segments;
  const header = decodeJsonSegment(headerSegment);
  if (header === undefined || getObjectField(header, "alg") !== "HS256") {
    return { success: false, error: "header" };
  }

  const payloadObject = decodeJsonSegment(payloadSegment);
  if (payloadObject === undefined) {
    return { success: false, error: "payload" };
  }

  try {
    const signingInput = `${headerSegment}.${payloadSegment}`;
    const expectedSignatureBytes = HMACSHA256.HashData(
      Encoding.UTF8.GetBytes(secret),
      Encoding.UTF8.GetBytes(signingInput),
    );
    const expectedSignatureHex = Convert.ToHexStringLower(
      expectedSignatureBytes,
    );
    const normalizedSignature = normalizeBase64Url(signatureSegment);
    if (normalizedSignature.length === 0) {
      return { success: false, error: "signature" };
    }
    const actualSignatureHex = Convert.ToHexStringLower(
      Convert.FromBase64String(normalizedSignature),
    );
    if (expectedSignatureHex !== actualSignatureHex) {
      return { success: false, error: "signature" };
    }
  } catch {
    return { success: false, error: "signature" };
  }

  const expValue = getObjectField(payloadObject, "exp");
  let exp: number | undefined = undefined;
  if (typeof expValue === "number") {
    exp = expValue as number;
  }
  if (exp !== undefined) {
    const nowSeconds = Number(DateTimeOffset.UtcNow.ToUnixTimeSeconds());
    if (exp < nowSeconds) {
      return { success: false, error: "expired" };
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
  return { success: true, payload };
};

export const fetchJwtApiKey = async (
  options: DbContextOptions,
  config: ServerConfig,
  tenantId: long,
  token: string,
  includeProfile: boolean,
): Promise<Result<{ api_key: string; email: string; user?: User }, string>> => {
  if (config.jwtSecret.trim().length === 0) {
    return err("JWT authentication is not enabled for this organization");
  }
  if (token.trim().length === 0) {
    return err("No JSON web token passed in request");
  }

  const verification = verifyJwt(token, config.jwtSecret);
  if (!verification.success) {
    return err("Bad JSON web token");
  }

  const { payload } = verification;
  if (payload.email === undefined) {
    return err("No email specified in JSON web token claims");
  }
  if (payload.email.trim().length === 0) {
    return err("Your username or password is incorrect");
  }

  const user = await getUserByEmail(options, tenantId, payload.email.trim());
  if (user === undefined) {
    return err("Your username or password is incorrect");
  }
  if (user.IsActive !== 1) {
    return err("Account is deactivated");
  }

  const activeApiKey = await getActiveApiKey(options, tenantId, user.Id);
  if (
    activeApiKey?.RawKey !== undefined &&
    activeApiKey.RawKey !== null &&
    activeApiKey.RawKey !== ""
  ) {
    return ok({
      api_key: activeApiKey.RawKey,
      email: user.Email,
      user: includeProfile ? user : undefined,
    });
  }

  const rawKey = generateApiKey();
  const keyHash = hashApiKey(rawKey);
  await createApiKey(options, tenantId, user.Id, keyHash, rawKey);

  return ok({
    api_key: rawKey,
    email: user.Email,
    user: includeProfile ? user : undefined,
  });
};
