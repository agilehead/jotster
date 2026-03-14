import type { Request, Response } from "@tsonic/express/index.js";
import { getBodyObject, getOptionalStringField } from "../helpers/body.ts";
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
  const body = getBodyObject(req);

  const statusText = getOptionalStringField(body, "status_text");
  const emojiName = getOptionalStringField(body, "emoji_name");
  const emojiCode = getOptionalStringField(body, "emoji_code");
  const reactionType = getOptionalStringField(body, "reaction_type");

  const result = await setUserStatusDomain(app.options, user, { statusText, emojiName, emojiCode, reactionType });
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error, code: "BAD_REQUEST" });
    return;
  }

  res.json({ result: "success", msg: "" });
};
