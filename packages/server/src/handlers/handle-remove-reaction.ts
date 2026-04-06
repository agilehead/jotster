import type { Request, Response } from "@tsonic/express/index.js";
import { getBodyObject, toLong } from "../helpers/body.ts";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { removeReactionDomain } from "@jotster/messages/Jotster.Messages.js";
import { parseId } from "@jotster/core/Jotster.Core.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleRemoveReaction = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const authResult = await authenticateRequest(
    app.options,
    req.get("authorization") ?? "",
  );
  if (!authResult.success) {
    res
      .status(401)
      .json({ result: "error", msg: authResult.error, code: "UNAUTHORIZED" });
    return;
  }

  const user = authResult.data;
  const body = getBodyObject(req);
  const messageId = parseId(req.param("message_id") ?? "");
  if (messageId === undefined) {
    res.status(400).json({ result: "error", msg: "Invalid message_id" });
    return;
  }

  const emojiName = (body["emoji_name"] ?? req.query["emoji_name"]) as string;
  const emojiCode = (body["emoji_code"] ?? req.query["emoji_code"]) as string;
  const reactionType = (body["reaction_type"] ??
    req.query["reaction_type"]) as string;

  const result = await removeReactionDomain(
    app.options,
    user,
    toLong(messageId),
    {
      emojiName,
      emojiCode,
      reactionType,
    },
  );

  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "" });
};
