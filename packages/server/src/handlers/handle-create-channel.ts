import type { int } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import { getBodyObject, toOptionalFlagInt, toOptionalInt } from "../helpers/body.ts";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { createChannelDomain } from "@jotster/channels/Jotster.Channels.js";
import type { AppContext } from "../helpers/app-context.ts";

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

  const subscriptions = body["subscriptions"] as { name: string; description?: string }[];
  if (!subscriptions || subscriptions.length === 0) {
    res.status(400).json({ result: "error", msg: "Missing required field: subscriptions" });
    return;
  }

  const entry = subscriptions[0];
  const name = entry.name;
  const description = entry.description;
  const isPrivate = toOptionalFlagInt(body["invite_only"]);
  const isWebPublic = toOptionalFlagInt(body["is_web_public"]);
  const historyPublicToSubscribers = toOptionalFlagInt(body["history_public_to_subscribers"]);
  const messageRetentionDays = toOptionalInt(body["message_retention_days"]);

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
