import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { getReadReceiptsDomain } from "@jotster/messages/Jotster.Messages.js";
import { parseId } from "@jotster/core/Jotster.Core.js";
import { toLong } from "../helpers/body.ts";
import type { AppContext } from "../helpers/app-context.ts";

export const handleGetReadReceipts = async (
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
  const messageId = parseId(req.params["message_id"] as string);
  if (messageId === undefined) {
    res.status(400).json({ result: "error", msg: "Invalid message_id" });
    return;
  }

  const result = await getReadReceiptsDomain(app.options, user, toLong(messageId));
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error, code: "BAD_REQUEST" });
    return;
  }

  const data = result.data;
  res.json({ result: "success", msg: "", user_ids: data.userIds });
};
