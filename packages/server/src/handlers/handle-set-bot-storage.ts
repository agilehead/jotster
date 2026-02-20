import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { setBotStorage } from "@jotster/webhooks/Jotster.Webhooks.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleSetBotStorage = async (
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

  const storage = req.body["storage"] as string | undefined;
  if (storage === undefined) {
    res.status(400).json({ result: "error", msg: "Missing 'storage' parameter" });
    return;
  }

  let entries: Record<string, string>;
  try {
    entries = JSON.parse(storage) as Record<string, string>;
  } catch (_e) {
    res.status(400).json({ result: "error", msg: "Invalid 'storage' parameter: expected JSON object" });
    return;
  }

  const keys = Object.keys(entries);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = entries[key];
    await setBotStorage(app.options, user.userId, key, value);
  }

  res.json({ result: "success", msg: "" });
};
