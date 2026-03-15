import type { long } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import {
  getBodyObject,
  getOptionalStringField,
  toOptionalFlagInt,
  toLong,
} from "../helpers/body.ts";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { parseId } from "@jotster/core/Jotster.Core.js";
import { updateSubscriptionPropertiesDomain } from "@jotster/subscriptions/Jotster.Subscriptions.js";
import type { AppContext } from "../helpers/app-context.ts";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";

const getOptionalObjectField = (source: unknown, key: string): unknown => {
  if (
    source === undefined ||
    source === null ||
    typeof source !== "object" ||
    Array.isArray(source)
  ) {
    return undefined;
  }

  for (const [entryKey, entryValue] of Object.entries(source)) {
    if (entryKey === key) {
      return entryValue;
    }
  }

  return undefined;
};
const FLAG_PROPERTIES = [
  "pin_to_top",
  "is_muted",
  "desktop_notifications",
  "push_notifications",
  "audible_notifications",
  "email_notifications",
  "wildcard_mentions_notify",
];

const toSubscriptionPropertyValue = (
  property: string,
  value: unknown,
): string | undefined => {
  if (property === "color") {
    return typeof value === "string" ? (value as string) : undefined;
  }

  for (let i = 0; i < FLAG_PROPERTIES.length; i++) {
    if (FLAG_PROPERTIES[i] === property) {
      const flag = toOptionalFlagInt(value);
      return flag === undefined ? undefined : flag.toString();
    }
  }

  return undefined;
};

export const handleUpdateSubscriptionProperties = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const authResult = await authenticateRequest(
    app.options,
    req.get("authorization") ?? "",
  );
  if (!authResult.success) {
    res
      .status(401)
      .json({ result: "error", msg: authResult.error, code: "UNAUTHORIZED" });
    return;
  }

  const user = authResult.data;
  const body = getBodyObject(req);
  const ignoredParametersUnsupported: string[] = [];
  const bodyKeys = Object.keys(body);
  for (let i = 0; i < bodyKeys.length; i++) {
    const bodyKey = bodyKeys[i];
    if (bodyKey !== "subscription_data") {
      ignoredParametersUnsupported.push(bodyKey);
    }
  }

  const subscriptionDataRaw = getOptionalStringField(body, "subscription_data");
  if (!subscriptionDataRaw) {
    res
      .status(400)
      .json({
        result: "error",
        msg: "Missing required field: subscription_data",
        code: "BAD_REQUEST",
      });
    return;
  }

  const parsed = JSON.parse(subscriptionDataRaw) as unknown;
  if (!Array.isArray(parsed)) {
    res
      .status(400)
      .json({
        result: "error",
        msg: "subscription_data must be an array",
        code: "BAD_REQUEST",
      });
    return;
  }

  const parsedArray = parsed as unknown[];
  const updates = new List<{
    streamId: long;
    property: string;
    propValue: string;
  }>();
  for (let i = 0; i < parsedArray.length; i++) {
    const update = parsedArray[i];
    const streamIdValue = getOptionalObjectField(update, "stream_id");
    const propertyValue = getOptionalObjectField(update, "property");
    const rawValue = getOptionalObjectField(update, "value");
    const streamIdStr =
      streamIdValue === undefined || streamIdValue === null
        ? undefined
        : `${streamIdValue}`;
    const streamId = parseId(streamIdStr);
    const property =
      typeof propertyValue === "string" ? (propertyValue as string) : undefined;
    if (streamId === undefined || property === undefined) {
      res
        .status(400)
        .json({
          result: "error",
          msg: "Invalid subscription update payload",
          code: "BAD_REQUEST",
        });
      return;
    }

    const propValue = toSubscriptionPropertyValue(property, rawValue);
    if (propValue === undefined) {
      res
        .status(400)
        .json({
          result: "error",
          msg: `Invalid value for property: ${property}`,
          code: "BAD_REQUEST",
        });
      return;
    }
    updates.Add({
      streamId: toLong(streamId),
      property,
      propValue,
    });
  }

  const result = await updateSubscriptionPropertiesDomain(
    app.options,
    user,
    updates.ToArray(),
  );
  if (!result.success) {
    res
      .status(400)
      .json({ result: "error", msg: result.error, code: "BAD_REQUEST" });
    return;
  }

  const response: Record<string, unknown> = { result: "success", msg: "" };
  if (ignoredParametersUnsupported.length > 0) {
    response["ignored_parameters_unsupported"] = ignoredParametersUnsupported;
  }
  res.json(response);
};
