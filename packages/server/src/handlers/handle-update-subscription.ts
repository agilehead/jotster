import type { Request, Response } from "@tsonic/express/index.js";
import { getBodyObject } from "../helpers/body.ts";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { updateSingleSubscriptionDomain } from "@jotster/subscriptions/Jotster.Subscriptions.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleUpdateSubscription = async (
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
  const streamId = req.params["stream_id"] as string;

  const property = body["property"] as string;
  const value = body["value"] as unknown;

  if (!property) {
    res.status(400).json({ result: "error", msg: "Missing required field: property" });
    return;
  }

  const result = await updateSingleSubscriptionDomain(app.options, user, streamId, property, value);
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "" });
};
