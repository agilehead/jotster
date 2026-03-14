import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { getUserChannelsDomain } from "@jotster/subscriptions/Jotster.Subscriptions.js";
import type { AppContext } from "../helpers/app-context.ts";
import { getOptionalStringField } from "../helpers/body.ts";

export const handleGetUserChannels = async (
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
  const targetUserId = req.params["user_id"] as string;
  const includeSubscribers = (getOptionalStringField(req.query as Record<string, unknown>, "include_subscribers") ?? "0") === "1";

  const result = await getUserChannelsDomain(app.options, user, targetUserId, includeSubscribers);
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  const payload: Record<string, unknown> = {};
  payload["result"] = "success";
  payload["msg"] = "";
  payload["channels"] = result.data;
  res.json(payload);
};
