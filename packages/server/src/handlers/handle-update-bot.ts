import type { JsValue, long } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { parseId } from "@jotster/core/Jotster.Core.js";
import { updateBotDomain } from "@jotster/users/Jotster.Users.js";
import { toLong } from "../helpers/body.ts";
import type { AppContext } from "../helpers/app-context.ts";

export const handleUpdateBot = async (
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
  const botId = parseId(req.param("bot_id") ?? "");
  if (botId === undefined) {
    res.status(400).json({ result: "error", msg: "Invalid bot_id" });
    return;
  }

  const body = req.body as Record<string, JsValue>;
  const updates: { fullName?: string; botOwnerId?: long } = {};
  if (body["full_name"] !== undefined)
    updates.fullName = body["full_name"] as string;
  if (body["bot_owner_id"] !== undefined)
    updates.botOwnerId = parseId(String(body["bot_owner_id"]));

  const result = await updateBotDomain(
    app.options,
    user,
    toLong(botId),
    updates,
  );
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({
    result: "success",
    msg: "",
    user_id: result.data.Id,
    full_name: result.data.FullName,
  });
};
