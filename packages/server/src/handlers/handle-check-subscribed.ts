import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { checkSubscribedDomain } from "@jotster/subscriptions/Jotster.Subscriptions.js";
import { parseId } from "@jotster/core/Jotster.Core.js";
import { toLong } from "../helpers/body.ts";
import type { AppContext } from "../helpers/app-context.ts";

export const handleCheckSubscribed = async (
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
  const targetUserId = parseId(req.params["user_id"] as string);
  if (targetUserId === undefined) {
    res.status(400).json({ result: "error", msg: "Invalid user_id" });
    return;
  }
  const streamId = parseId(req.params["stream_id"] as string);
  if (streamId === undefined) {
    res.status(400).json({ result: "error", msg: "Invalid stream_id" });
    return;
  }

  const result = await checkSubscribedDomain(
    app.options,
    user,
    toLong(targetUserId),
    toLong(streamId),
  );
  if (!result.success) {
    res
      .status(400)
      .json({ result: "error", msg: result.error, code: "BAD_REQUEST" });
    return;
  }

  const payload: Record<string, unknown> = {};
  payload["result"] = "success";
  payload["msg"] = "";
  payload["is_subscribed"] = result.data;
  res.json(payload);
};
