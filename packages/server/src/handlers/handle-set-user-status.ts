import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { setUserStatusDomain } from "@jotster/presence/Jotster.Presence.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleSetUserStatus = async (
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

  const statusText = req.body["status_text"] as string | undefined;
  const emojiName = req.body["emoji_name"] as string | undefined;
  const emojiCode = req.body["emoji_code"] as string | undefined;
  const reactionType = req.body["reaction_type"] as string | undefined;

  const result = await setUserStatusDomain(app.options, user, { statusText, emojiName, emojiCode, reactionType });
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "" });
};
