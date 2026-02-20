import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { deleteBotStorage } from "@jotster/webhooks/Jotster.Webhooks.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleDeleteBotStorage = async (
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

  const key = req.body["key"] as string | undefined ?? req.query["key"] as string | undefined;
  if (key === undefined || key.Trim().Length === 0) {
    res.status(400).json({ result: "error", msg: "Missing 'key' parameter" });
    return;
  }

  const deleted = await deleteBotStorage(app.options, user.userId, key);
  if (!deleted) {
    res.status(404).json({ result: "error", msg: "Key not found" });
    return;
  }

  res.json({ result: "success", msg: "" });
};
