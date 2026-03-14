import type { Request, Response } from "@tsonic/express/index.js";
import { getBodyObject, getOptionalStringField, toOptionalRecord } from "../helpers/body.ts";
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
  if (user.isBot !== 1) {
    res.status(403).json({ result: "error", msg: "Only bot users can access bot storage" });
    return;
  }

  const body = getBodyObject(req);

  const storage = getOptionalStringField(body, "storage");
  if (storage === undefined) {
    res.status(400).json({ result: "error", msg: "Missing 'storage' parameter" });
    return;
  }

  const entries = toOptionalRecord(storage);
  if (entries === undefined) {
    res.status(400).json({ result: "error", msg: "Invalid 'storage' parameter: expected JSON object" });
    return;
  }

  const keys = Object.keys(entries);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const rawValue = entries[key];
    if (typeof rawValue !== "string") {
      res.status(400).json({ result: "error", msg: "Invalid 'storage' parameter: values must be strings" });
      return;
    }
    const value = rawValue as string;
    await setBotStorage(app.options, user.userId, key, value);
  }

  res.json({ result: "success", msg: "" });
};
