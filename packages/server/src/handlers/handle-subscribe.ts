import type { JsValue, int } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import {
  getBodyObject,
  getOptionalFlagIntField,
  getOptionalIntField,
  getOptionalJsonArrayField,
} from "../helpers/body.ts";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { subscribeDomain } from "@jotster/subscriptions/Jotster.Subscriptions.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import type { AppContext } from "../helpers/app-context.ts";

const getOptionalObjectField = (
  source: JsValue,
  key: string,
): JsValue | undefined => {
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

const toSubscriptionEntries = (
  value: JsValue[] | undefined,
): { name: string; description?: string }[] | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const result = new List<{ name: string; description?: string }>();
  for (let i = 0; i < value.length; i++) {
    const entry = value[i];
    if (
      entry === undefined ||
      entry === null ||
      typeof entry !== "object" ||
      Array.isArray(entry)
    ) {
      return undefined;
    }
    const nameValue = getOptionalObjectField(entry, "name");
    const name =
      typeof nameValue === "string" ? (nameValue as string) : undefined;
    if (name === undefined) {
      return undefined;
    }
    const descriptionValue = getOptionalObjectField(entry, "description");
    const description =
      typeof descriptionValue === "string"
        ? (descriptionValue as string)
        : undefined;
    result.Add({ name, description });
  }
  return result.ToArray();
};

const toStringArray = (value: JsValue[] | undefined): string[] | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const result = new List<string>();
  for (let i = 0; i < value.length; i++) {
    const entry = value[i];
    if (typeof entry !== "string") {
      return undefined;
    }
    result.Add(entry as string);
  }
  return result.ToArray();
};

const appendChannels = (
  target: Record<string, string[]>,
  email: string,
  channels: string[],
): void => {
  const merged = new List<string>();
  const existing = getOptionalObjectField(target, email);
  if (existing !== undefined && Array.isArray(existing)) {
    const existingValues = existing as JsValue[];
    for (let i = 0; i < existingValues.length; i++) {
      const entry = existingValues[i];
      if (typeof entry === "string") {
        merged.Add(entry as string);
      }
    }
  }

  for (let i = 0; i < channels.length; i++) {
    merged.Add(channels[i]);
  }

  target[email] = merged.ToArray();
};

export const handleSubscribe = async (
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

  const subscriptions = toSubscriptionEntries(
    getOptionalJsonArrayField(body, "subscriptions"),
  );
  if (!subscriptions || subscriptions.length === 0) {
    res
      .status(400)
      .json({ result: "error", msg: "Missing required field: subscriptions" });
    return;
  }

  const principals = toStringArray(
    getOptionalJsonArrayField(body, "principals"),
  );

  const inviteOnly = getOptionalFlagIntField(body, "invite_only");
  const isWebPublic = getOptionalFlagIntField(body, "is_web_public");
  const historyPublicToSubscribers = getOptionalFlagIntField(
    body,
    "history_public_to_subscribers",
  );
  const messageRetentionDays = getOptionalIntField(
    body,
    "message_retention_days",
  );

  const createParams: {
    isPrivate?: int;
    isWebPublic?: int;
    historyPublicToSubscribers?: int;
    messageRetentionDays?: int;
  } = {
    isPrivate: inviteOnly,
    isWebPublic,
    historyPublicToSubscribers,
    messageRetentionDays,
  };

  const mergedSubscribed: Record<string, string[]> = {};
  const mergedAlreadySubscribed: Record<string, string[]> = {};

  for (let i = 0; i < subscriptions.length; i++) {
    const entry = subscriptions[i];
    const result = await subscribeDomain(
      app.options,
      user,
      entry.name,
      principals,
      createParams,
    );
    if (!result.success) {
      res.status(400).json({ result: "error", msg: result.error });
      return;
    }

    const subscribed = result.data.subscribed;
    const alreadySubscribed = result.data.alreadySubscribed;

    const subscribedKeys = subscribed.Keys;
    for (let j = 0; j < subscribedKeys.length; j++) {
      const key = subscribedKeys[j];
      appendChannels(mergedSubscribed, key, subscribed[key]);
    }

    const alreadyKeys = alreadySubscribed.Keys;
    for (let j = 0; j < alreadyKeys.length; j++) {
      const key = alreadyKeys[j];
      appendChannels(mergedAlreadySubscribed, key, alreadySubscribed[key]);
    }
  }

  res.json({
    result: "success",
    msg: "",
    subscribed: mergedSubscribed,
    already_subscribed: mergedAlreadySubscribed,
  });
};
