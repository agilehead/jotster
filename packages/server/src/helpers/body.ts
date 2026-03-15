import type { int, long } from "@tsonic/core/types.js";
import type { Request } from "@tsonic/express/index.js";
import { Convert } from "@tsonic/dotnet/System.js";

export const getBodyObject = (req: Request): Record<string, unknown> => {
  const body = req.body;
  if (body === undefined || body === null || typeof body !== "object" || Array.isArray(body)) {
    return {};
  }
  return body as Record<string, unknown>;
};

export const copyRecord = (value: object): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  for (const [entryKey, entryValue] of Object.entries(value)) {
    result[entryKey] = entryValue;
  }
  return result;
};

export const getOptionalField = (source: Record<string, unknown>, key: string): unknown => {
  for (const [entryKey, entryValue] of Object.entries(source)) {
    if (entryKey === key) {
      return entryValue;
    }
  }
  return undefined;
};

export const hasField = (source: Record<string, unknown>, key: string): boolean => {
  for (const [entryKey] of Object.entries(source)) {
    if (entryKey === key) {
      return true;
    }
  }
  return false;
};

export const getOptionalStringField = (source: Record<string, unknown>, key: string): string | undefined => {
  const value = getOptionalField(source, key);
  if (value === undefined) {
    return undefined;
  }
  return typeof value === "string" ? (value as string) : undefined;
};

export const getOptionalBooleanField = (source: Record<string, unknown>, key: string): boolean | undefined => {
  const value = getOptionalField(source, key);
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (value === 1) {
      return true;
    }
    if (value === 0) {
      return false;
    }
    return undefined;
  }
  if (typeof value !== "string") {
    return undefined;
  }

  const stringValue = value as string;
  const normalized = stringValue.trim().toLowerCase();
  if (normalized === "true" || normalized === "1") {
    return true;
  }
  if (normalized === "false" || normalized === "0") {
    return false;
  }
  return undefined;
};

export const toOptionalRecord = (value: unknown): Record<string, unknown> | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === "object" && !Array.isArray(value)) {
    return copyRecord(value as object);
  }
  if (typeof value !== "string") {
    return undefined;
  }
  const stringValue = value as string;
  const text = stringValue.trim();
  if (text.length === 0) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(text) as unknown;
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return undefined;
    }
    return copyRecord(parsed as object);
  } catch {
    return undefined;
  }
};

export const toOptionalStringArray = (value: unknown): string[] | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  let values: unknown[];
  if (Array.isArray(value)) {
    values = value as unknown[];
  } else if (typeof value === "string") {
    const stringValue = value as string;
    const text = stringValue.trim();
    if (text.length === 0) {
      return undefined;
    }
    let parsed: unknown = undefined;
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      return undefined;
    }
    if (!Array.isArray(parsed)) {
      return undefined;
    }
    values = parsed as unknown[];
  } else {
    return undefined;
  }

  const result: string[] = [];
  for (let i = 0; i < values.length; i++) {
    const item = values[i];
    if (typeof item !== "string") {
      return undefined;
    }
    result.push(item as string);
  }
  return result;
};

export const getOptionalJsonArrayField = (source: Record<string, unknown>, key: string): unknown[] | undefined => {
  const value = getOptionalField(source, key);
  if (value === undefined) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value as unknown[];
  }
  if (typeof value !== "string") {
    return undefined;
  }
  const text = value as string;
  if (text.length === 0) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(text) as unknown;
    return Array.isArray(parsed) ? (parsed as unknown[]) : undefined;
  } catch {
    return undefined;
  }
};

export const getOptionalJsonObjectField = (source: Record<string, unknown>, key: string): Record<string, unknown> | undefined => {
  return toOptionalRecord(getOptionalField(source, key));
};

export const getOptionalStringArrayField = (source: Record<string, unknown>, key: string): string[] | undefined => {
  return toOptionalStringArray(getOptionalField(source, key));
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
  return toOptionalInt(getOptionalField(body, key));
};

export const getOptionalFlagIntField = (body: Record<string, unknown>, key: string): int | undefined => {
  return toOptionalFlagInt(getOptionalField(body, key));
};

export const toOptionalLong = (value: unknown): long | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 1) {
      return undefined;
    }
    return Convert.ToInt64(value);
  }
  if (typeof value === "string") {
    const trimmed = (value as string).trim();
    if (trimmed.length === 0) {
      return undefined;
    }
    const parsed = parseInt(trimmed, 10);
    if (Number.isNaN(parsed) || parsed < 1) {
      return undefined;
    }
    return Convert.ToInt64(parsed);
  }
  return undefined;
};

export const toLong = (value: long | undefined): long => {
  if (value === undefined) {
    return Convert.ToInt64(0);
  }
  return Convert.ToInt64(value);
};

export const getOptionalLongField = (body: Record<string, unknown>, key: string): long | undefined => {
  return toOptionalLong(getOptionalField(body, key));
};

export const toLongArray = (values: string[] | undefined): long[] | undefined => {
  if (values === undefined) {
    return undefined;
  }
  const result: long[] = [];
  for (let i = 0; i < values.length; i++) {
    const parsed = toOptionalLong(values[i]);
    if (parsed === undefined) {
      return undefined;
    }
    result.push(toLong(parsed));
  }
  return result;
};
