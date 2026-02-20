import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { updateFlagsDomain } from "@jotster/messages/Jotster.Messages.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleUpdateMessageFlags = async (
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

  const messagesRaw = req.body["messages"] as string;
  const parsedMessages = JSON.parse(messagesRaw) as string[];
  const op = req.body["op"] as string;
  const flag = req.body["flag"] as string;

  const result = await updateFlagsDomain(app.options, user, { messages: parsedMessages, op, flag });
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  const data = result.data;
  res.json({ result: "success", msg: "", messages: data.messages });
};
