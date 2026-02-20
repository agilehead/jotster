import type { Request, Response } from "@tsonic/express/index.js";
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

  const subscriptions = req.body["subscriptions"] as { name: string; description?: string }[];
  if (!subscriptions || subscriptions.length === 0) {
    res.status(400).json({ result: "error", msg: "Missing required field: subscriptions" });
    return;
  }

  const entry = subscriptions[0];
  const name = entry.name;
  const description = entry.description;
  const isPrivate = req.body["invite_only"] as boolean | undefined;
  const isWebPublic = req.body["is_web_public"] as boolean | undefined;
  const historyPublicToSubscribers = req.body["history_public_to_subscribers"] as boolean | undefined;
  const messageRetentionDays = req.body["message_retention_days"] as number | undefined;

  const result = await createChannelDomain(app.options, user, {
    name,
    description,
    isPrivate,
    isWebPublic,
    historyPublicToSubscribers,
    messageRetentionDays,
  });

  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  const subscribed: Record<string, string[]> = {};
  subscribed[user.email] = [name];

  res.json({ result: "success", msg: "", subscribed, already_subscribed: {} });
};
