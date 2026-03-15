import type { Request, Response } from "@tsonic/express/index.js";
import { getBodyObject, getOptionalStringField } from "../helpers/body.ts";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { deleteBotStorage } from "@jotster/webhooks/Jotster.Webhooks.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleDeleteBotStorage = async (
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
  if (user.isBot !== 1) {
    res
      .status(403)
      .json({ result: "error", msg: "Only bot users can access bot storage" });
    return;
  }

  const body = getBodyObject(req);
  const query = req.query as Record<string, unknown>;

  const key =
    getOptionalStringField(body, "key") ?? getOptionalStringField(query, "key");

  const deleted = await deleteBotStorage(app.options, user.userId, key);
  if (!deleted) {
    res.status(404).json({ result: "error", msg: "Key not found" });
    return;
  }

  res.json({ result: "success", msg: "" });
};
