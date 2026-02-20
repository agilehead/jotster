import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { getChannelIdByName } from "@jotster/channels/Jotster.Channels.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleGetStreamId = async (
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
  const streamName = req.query["stream"] as string;

  if (!streamName) {
    res.status(400).json({ result: "error", msg: "Missing required parameter: stream" });
    return;
  }

  const result = await getChannelIdByName(app.options, user.tenantId, streamName);
  if (!result.success) {
    res.status(404).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ stream_id: result.data });
};
