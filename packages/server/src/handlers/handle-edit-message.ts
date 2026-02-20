import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
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
  const messageId = req.params["message_id"] as string;

  const content = req.body["content"] as string | undefined;
  const topic = req.body["topic"] as string | undefined;
  const streamId = req.body["stream_id"] as string | undefined;
  const propagateMode = req.body["propagate_mode"] as string | undefined;

  const result = await editMessageDomain(app.options, user, messageId, {
    content,
    topic,
    channelId: streamId,
    propagateMode,
  });

  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "" });
};
