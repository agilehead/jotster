import type { JsValue, int, long } from "@tsonic/core/types.js";
import type { Request } from "@tsonic/express/index.js";
import { Dictionary } from "@tsonic/dotnet/System.Collections.Generic.js";
import { Convert } from "@tsonic/dotnet/System.js";
import { JsonElement, JsonValueKind } from "@tsonic/dotnet/System.Text.Json.js";

export const getBodyObject = (req: Request): Record<string, JsValue> => {
  const body = req.body;
  if (
    body === undefined ||
    body === null ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    return {};
  }
  return body as Record<string, JsValue>;
};

export const copyRecord = (value: object): Record<string, JsValue> => {
  const result: Record<string, JsValue> = {};
  for (const [entryKey, entryValue] of Object.entries(value)) {
    result[entryKey] = entryValue;
  }
  return result;
};

const convertJsonElementToJsValue = (element: JsonElement): JsValue => {
  switch (element.ValueKind) {
    case JsonValueKind.Object: {
      const result = new Dictionary<string, JsValue>();
      const properties = element.EnumerateObject();
      while (properties.MoveNext()) {
        const property = properties.Current;
        result.Add(property.Name, convertJsonElementToJsValue(property.Value));
      }
      return result;
    }
    case JsonValueKind.Array: {
      const result: JsValue[] = [];
      const items = element.EnumerateArray();
      while (items.MoveNext()) {
        result.push(convertJsonElementToJsValue(items.Current));
      }
      return result;
    }
    case JsonValueKind.String:
      return element.GetString() ?? "";
    case JsonValueKind.Number:
      return element.GetDouble();
    case JsonValueKind.True:
      return true;
    case JsonValueKind.False:
      return false;
    case JsonValueKind.Null:
    case JsonValueKind.Undefined:
      return null;
    default:
      return null;
  }
};

export const parseJsonValueText = (text: string): JsValue => {
  return convertJsonElementToJsValue(JsonElement.Parse(text));
};

export const tryParseJsonValueText = (
  text: string,
): JsValue | undefined => {
  try {
    return parseJsonValueText(text);
  } catch {
    return undefined;
  }
};

export const getOptionalField = (
  source: Record<string, JsValue>,
  key: string,
): JsValue | undefined => {
  for (const [entryKey, entryValue] of Object.entries(source)) {
    if (entryKey === key) {
      return entryValue;
    }
  }
  return undefined;
};

export const hasField = (
  source: Record<string, JsValue>,
  key: string,
): boolean => {
  for (const [entryKey] of Object.entries(source)) {
    if (entryKey === key) {
      return true;
    }
  }
  return false;
};

export const getOptionalStringField = (
  source: Record<string, JsValue>,
  key: string,
): string | undefined => {
  const value = getOptionalField(source, key);
  if (value === undefined) {
    return undefined;
  }
  return typeof value === "string" ? (value as string) : undefined;
};

export const getOptionalBooleanField = (
  source: Record<string, JsValue>,
  key: string,
): boolean | undefined => {
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

export const toOptionalRecord = (
  value: JsValue | undefined,
): Record<string, JsValue> | undefined => {
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
  const parsed = tryParseJsonValueText(text);
  if (
    parsed === undefined ||
    parsed === null ||
    typeof parsed !== "object" ||
    Array.isArray(parsed)
  ) {
    return undefined;
  }
  return copyRecord(parsed as object);
};

export const toOptionalStringArray = (
  value: JsValue | undefined,
): string[] | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  let values: JsValue[];
  if (Array.isArray(value)) {
    values = value as JsValue[];
  } else if (typeof value === "string") {
    const stringValue = value as string;
    const text = stringValue.trim();
    if (text.length === 0) {
      return undefined;
    }
    const parsed = tryParseJsonValueText(text);
    if (parsed === undefined) {
      return undefined;
    }
    if (!Array.isArray(parsed)) {
      return undefined;
    }
    values = parsed as JsValue[];
  } else {
    return undefined;
  }

  const result: string[] = [];
  for (let i = 0; i < values.length; i++) {
    const item = values[i];
    if (typeof item === "string") {
      result.push(item as string);
    } else if (typeof item === "number" && Number.isFinite(item as number)) {
      result.push(`${item}`);
    } else {
      return undefined;
    }
  }
  return result;
};

export const getOptionalJsonArrayField = (
  source: Record<string, JsValue>,
  key: string,
): JsValue[] | undefined => {
  const value = getOptionalField(source, key);
  if (value === undefined) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value as JsValue[];
  }
  if (typeof value !== "string") {
    return undefined;
  }
  const text = value as string;
  if (text.length === 0) {
    return undefined;
  }
  const parsed = tryParseJsonValueText(text);
  if (!Array.isArray(parsed)) {
    return undefined;
  }
  return parsed as JsValue[];
};

export const getOptionalJsonObjectField = (
  source: Record<string, JsValue>,
  key: string,
): Record<string, JsValue> | undefined => {
  return toOptionalRecord(getOptionalField(source, key));
};

export const getOptionalStringArrayField = (
  source: Record<string, JsValue>,
  key: string,
): string[] | undefined => {
  return toOptionalStringArray(getOptionalField(source, key));
};

export const toOptionalInt = (value: JsValue | undefined): int | undefined => {
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

export const toOptionalFlagInt = (
  value: JsValue | undefined,
): int | undefined => {
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

export const getOptionalIntField = (
  body: Record<string, JsValue>,
  key: string,
): int | undefined => {
  return toOptionalInt(getOptionalField(body, key));
};

export const getOptionalFlagIntField = (
  body: Record<string, JsValue>,
  key: string,
): int | undefined => {
  return toOptionalFlagInt(getOptionalField(body, key));
};

export const toOptionalLong = (
  value: JsValue | undefined,
): long | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === "number") {
    const numericValue = value as number;
    if (!Number.isFinite(numericValue) || numericValue < 1) {
      return undefined;
    }
    return Convert.ToInt64(numericValue);
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

export const getOptionalLongField = (
  body: Record<string, JsValue>,
  key: string,
): long | undefined => {
  return toOptionalLong(getOptionalField(body, key));
};

export const toLongArray = (
  values: string[] | undefined,
): long[] | undefined => {
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
