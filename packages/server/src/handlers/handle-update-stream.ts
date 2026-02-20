import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { updateChannelDomain } from "@jotster/channels/Jotster.Channels.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleUpdateStream = async (
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
  const streamId = req.params["stream_id"] as string;

  const body = req.body as Record<string, unknown>;
  const updates: {
    name?: string;
    description?: string;
    isPrivate?: boolean;
    isWebPublic?: boolean;
    historyPublicToSubscribers?: boolean;
    messageRetentionDays?: number;
  } = {};

  if (body["new_name"] !== undefined) updates.name = body["new_name"] as string;
  if (body["description"] !== undefined) updates.description = body["description"] as string;
  if (body["is_private"] !== undefined) updates.isPrivate = body["is_private"] as boolean;
  if (body["is_web_public"] !== undefined) updates.isWebPublic = body["is_web_public"] as boolean;
  if (body["history_public_to_subscribers"] !== undefined) updates.historyPublicToSubscribers = body["history_public_to_subscribers"] as boolean;
  if (body["message_retention_days"] !== undefined) updates.messageRetentionDays = body["message_retention_days"] as number;

  const result = await updateChannelDomain(app.options, user, streamId, updates);
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "" });
};
