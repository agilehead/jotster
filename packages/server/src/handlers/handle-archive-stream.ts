import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { archiveChannelDomain } from "@jotster/channels/Jotster.Channels.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleArchiveStream = async (
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

  const result = await archiveChannelDomain(app.options, user, streamId);
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error, code: "BAD_REQUEST" });
    return;
  }

  res.json({ result: "success", msg: "" });
};
