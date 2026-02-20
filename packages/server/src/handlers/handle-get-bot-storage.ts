import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { getBotStorage } from "@jotster/webhooks/Jotster.Webhooks.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleGetBotStorage = async (
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

  const entries = await getBotStorage(app.options, user.userId);

  const storage: Record<string, unknown> = {};
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    storage[entry.Key] = entry.Value;
  }

  res.json({ result: "success", storage });
};
