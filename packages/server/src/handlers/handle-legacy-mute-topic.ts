import type { Request, Response } from "@tsonic/express/index.js";
import { getBodyObject } from "../helpers/body.ts";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { legacyMuteTopicDomain } from "@jotster/presence/Jotster.Presence.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleLegacyMuteTopic = async (
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

  const op = body["op"] as string;
  const stream = body["stream"] as string | undefined;
  const streamId = body["stream_id"] as string | undefined;
  const topic = body["topic"] as string;

  const result = await legacyMuteTopicDomain(app.options, user, {
    op,
    streamOrStreamId: stream || streamId,
    topic,
  });

  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "" });
};
