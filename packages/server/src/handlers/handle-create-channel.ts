import type { int } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import {
  getBodyObject,
  getOptionalFlagIntField,
  getOptionalIntField,
  getOptionalJsonArrayField,
} from "../helpers/body.ts";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { createChannelDomain } from "@jotster/channels/Jotster.Channels.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import type { AppContext } from "../helpers/app-context.ts";

const getOptionalObjectField = (source: unknown, key: string): unknown => {
  if (source === undefined || source === null || typeof source !== "object" || Array.isArray(source)) {
    return undefined;
  }

  for (const [entryKey, entryValue] of Object.entries(source)) {
    if (entryKey === key) {
      return entryValue;
    }
  }

  return undefined;
};

const toSubscriptionEntries = (value: unknown[] | undefined): { name: string; description?: string }[] | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const entries = new List<{ name: string; description?: string }>();
  for (let i = 0; i < value.length; i++) {
    const entry = value[i];
    if (entry === undefined || entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      return undefined;
    }
    const nameValue = getOptionalObjectField(entry, "name");
    const name = typeof nameValue === "string" ? (nameValue as string) : undefined;
    if (name === undefined) {
      return undefined;
    }
    const descriptionValue = getOptionalObjectField(entry, "description");
    const description = typeof descriptionValue === "string" ? (descriptionValue as string) : undefined;
    entries.Add({ name, description });
  }
  return entries.ToArray();
};

export const handleCreateChannel = async (
  req: Request,
  res: Response,
  app: AppContext
): Promise<void> => {
  const authResult = await authenticateRequest(app.options, req.get("authorization") ?? "");
  if (!authResult.success) {
    res.status(401).json({ result: "error", msg: authResult.error, code: "UNAUTHORIZED" });
    return;
  }

  const user = authResult.data;
  const body = getBodyObject(req);

  const subscriptions = toSubscriptionEntries(getOptionalJsonArrayField(body, "subscriptions"));
  if (!subscriptions || subscriptions.length === 0) {
    res.status(400).json({ result: "error", msg: "Missing required field: subscriptions" });
    return;
  }

  const entry = subscriptions[0];
  const name = entry.name;
  const description = entry.description;
  const isPrivate = getOptionalFlagIntField(body, "invite_only");
  const isWebPublic = getOptionalFlagIntField(body, "is_web_public");
  const historyPublicToSubscribers = getOptionalFlagIntField(body, "history_public_to_subscribers");
  const messageRetentionDays = getOptionalIntField(body, "message_retention_days");

  const input: {
    name: string;
    description?: string;
    isPrivate?: int;
    isWebPublic?: int;
    historyPublicToSubscribers?: int;
    messageRetentionDays?: int;
  } = {
    name,
    description,
    isPrivate,
    isWebPublic,
    historyPublicToSubscribers,
    messageRetentionDays,
  };

  const result = await createChannelDomain(app.options, user, input);

  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  const subscribed: Record<string, string[]> = {};
  subscribed[user.email] = [name];

  res.json({ result: "success", msg: "", subscribed, already_subscribed: {} });
};
