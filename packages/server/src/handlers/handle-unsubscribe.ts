import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { unsubscribeDomain } from "@jotster/subscriptions/Jotster.Subscriptions.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleUnsubscribe = async (
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

  const subscriptionsRaw = req.body["subscriptions"] as string;
  if (!subscriptionsRaw) {
    res.status(400).json({ result: "error", msg: "Missing required field: subscriptions" });
    return;
  }

  const channelNames = JSON.parse(subscriptionsRaw) as string[];

  const result = await unsubscribeDomain(app.options, user, channelNames);
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({
    result: "success",
    msg: "",
    removed: result.data.removed,
    not_removed: result.data.notRemoved,
  });
};
