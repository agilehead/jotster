import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { removeAlertWordsDomain } from "@jotster/notifications/Jotster.Notifications.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleRemoveAlertWords = async (
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

  const alertWordsRaw = req.body["alert_words"] as string;
  if (!alertWordsRaw) {
    res.status(400).json({ result: "error", msg: "Missing required field: alert_words" });
    return;
  }

  const words = JSON.parse(alertWordsRaw) as string[];

  const result = await removeAlertWordsDomain(app.options, user, words);
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "", alert_words: result.data });
};
