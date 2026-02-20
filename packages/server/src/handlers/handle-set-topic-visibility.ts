import type { Request, Response } from "@tsonic/express/index.js";
import type { int } from "@tsonic/core/types.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { setTopicVisibilityDomain } from "@jotster/presence/Jotster.Presence.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleSetTopicVisibility = async (
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

  const streamId = req.body["stream_id"] as string;
  const topic = req.body["topic"] as string;
  const visibilityPolicy = parseInt(req.body["visibility_policy"] as string) as int;

  const result = await setTopicVisibilityDomain(app.options, user, {
    channelId: streamId,
    topic,
    visibilityPolicy,
  });

  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "" });
};
