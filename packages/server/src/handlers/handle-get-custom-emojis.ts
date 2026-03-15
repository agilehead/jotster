import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { getCustomEmojisDomain } from "@jotster/emoji/Jotster.Emoji.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleGetCustomEmojis = async (
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
  const emojiMap = await getCustomEmojisDomain(app.options, user.tenantId);

  res.json({ result: "success", msg: "", emoji: emojiMap });
};
