import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { getChannelsDomain } from "@jotster/channels/Jotster.Channels.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleGetStreams = async (
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
  const includeArchived = (req.query["include_archived"] as string ?? "0") === "1";

  const channels = await getChannelsDomain(app.options, user, includeArchived);

  const streams = new List<Record<string, unknown>>();
  for (let i = 0; i < channels.length; i++) {
    const ch = channels[i];
    const s: Record<string, unknown> = {};
    s["stream_id"] = ch.Id;
    s["name"] = ch.Name;
    s["description"] = ch.Description;
    s["rendered_description"] = ch.RenderedDescription;
    s["invite_only"] = ch.IsPrivate === 1;
    s["is_web_public"] = ch.IsWebPublic === 1;
    s["history_public_to_subscribers"] = ch.HistoryPublicToSubscribers === 1;
    s["creator_id"] = ch.CreatorId ?? null;
    s["date_created"] = ch.CreatedAt;
    s["first_message_id"] = ch.FirstMessageId ?? null;
    s["message_retention_days"] = ch.MessageRetentionDays ?? null;
    s["is_archived"] = ch.IsArchived === 1;
    streams.Add(s);
  }

  res.json({ streams: streams.ToArray() });
};
