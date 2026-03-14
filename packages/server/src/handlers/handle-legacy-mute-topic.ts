import type { Request, Response } from "@tsonic/express/index.js";
import { getBodyObject, getOptionalStringField } from "../helpers/body.ts";
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

  const op = getOptionalStringField(body, "op");
  const stream = getOptionalStringField(body, "stream");
  const streamId = getOptionalStringField(body, "stream_id");
  const topic = getOptionalStringField(body, "topic");
  if (op === undefined || topic === undefined) {
    res.status(400).json({ result: "error", msg: "Missing required field", code: "BAD_REQUEST" });
    return;
  }

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
