import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { deactivateCustomEmojiDomain } from "@jotster/emoji/Jotster.Emoji.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleDeactivateCustomEmoji = async (
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

  // Admin only: role <= 200
  if (user.role > 200) {
    res.status(403).json({ result: "error", msg: "Insufficient permission" });
    return;
  }

  const emojiName = req.params["emoji_name"] as string;
  if (!emojiName) {
    res.status(400).json({ result: "error", msg: "Missing emoji name" });
    return;
  }

  const result = await deactivateCustomEmojiDomain(
    app.options,
    user,
    emojiName,
  );
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "" });
};
