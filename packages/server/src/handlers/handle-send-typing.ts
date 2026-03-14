import type { Request, Response } from "@tsonic/express/index.js";
import { getBodyObject, getOptionalStringArrayField, getOptionalStringField } from "../helpers/body.ts";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { sendTypingDomain } from "@jotster/presence/Jotster.Presence.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleSendTyping = async (
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
  if (op === undefined) {
    res.status(400).json({ result: "error", msg: "Missing required field: op" });
    return;
  }
  const type = getOptionalStringField(body, "type");
  const parsedTo = getOptionalStringArrayField(body, "to");
  const streamId = getOptionalStringField(body, "stream_id");
  const topic = getOptionalStringField(body, "topic");

  const result = await sendTypingDomain(app.options, user, { op, type, to: parsedTo, streamId, topic });
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "" });
};
