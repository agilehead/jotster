import type { Request, Response } from "@tsonic/express/index.js";
import { getBodyObject } from "../helpers/body.ts";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { bulkUpdateSubscriptionsDomain } from "@jotster/subscriptions/Jotster.Subscriptions.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleBulkSubscriptions = async (
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
  const body = getBodyObject(req);

  const addRaw = body["add"] as string | undefined;
  const deleteRaw = body["delete"] as string | undefined;

  const addList = addRaw ? JSON.parse(addRaw) as { name: string; description?: string }[] : undefined;
  const removeList = deleteRaw ? JSON.parse(deleteRaw) as string[] : undefined;

  const result = await bulkUpdateSubscriptionsDomain(app.options, user, addList, removeList);
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({
    result: "success",
    msg: "",
    subscribed: result.data.subscribed,
    already_subscribed: result.data.alreadySubscribed,
    removed: result.data.removed,
    not_removed: result.data.notRemoved,
  });
};
