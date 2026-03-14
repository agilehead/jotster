import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { getChannelByIdDomain } from "@jotster/channels/Jotster.Channels.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleGetStream = async (
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

  const result = await getChannelByIdDomain(app.options, user, streamId);
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error, code: "BAD_REQUEST" });
    return;
  }

  const ch = result.data;
  const stream: Record<string, unknown> = {};
  stream["stream_id"] = ch.Id;
  stream["name"] = ch.Name;
  stream["description"] = ch.Description;
  stream["rendered_description"] = ch.RenderedDescription;
  stream["invite_only"] = ch.IsPrivate === 1;
  stream["is_web_public"] = ch.IsWebPublic === 1;
  stream["history_public_to_subscribers"] = ch.HistoryPublicToSubscribers === 1;
  stream["creator_id"] = ch.CreatorId ?? null;
  stream["date_created"] = ch.CreatedAt;
  stream["first_message_id"] = ch.FirstMessageId ?? null;
  stream["message_retention_days"] = ch.MessageRetentionDays ?? null;
  stream["is_archived"] = ch.IsArchived === 1;

  const payload: Record<string, unknown> = {};
  payload["result"] = "success";
  payload["msg"] = "";
  payload["stream"] = stream;
  res.json(payload);
};
