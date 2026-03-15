import type { Request, Response } from "@tsonic/express/index.js";
import { getBodyObject, getOptionalStringField, toLong} from "../helpers/body.ts";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { parseId } from "@jotster/core/Jotster.Core.js";
import { editMessageDomain } from "@jotster/messages/Jotster.Messages.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleEditMessage = async (
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
  const messageId = parseId(req.params["message_id"] as string);
  if (messageId === undefined) {
    res.status(400).json({ result: "error", msg: "Invalid message_id", code: "BAD_REQUEST" });
    return;
  }

  const content = getOptionalStringField(body, "content");
  const topic = getOptionalStringField(body, "topic");
  const streamId = parseId(getOptionalStringField(body, "stream_id"));
  const propagateMode = getOptionalStringField(body, "propagate_mode");

  const result = await editMessageDomain(app.options, user, toLong(messageId), ({
    content,
    topic,
    channelId: toLong(streamId),
    propagateMode,
  }));

  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error, code: "BAD_REQUEST" });
    return;
  }

  res.json({ result: "success", msg: "" });
};
