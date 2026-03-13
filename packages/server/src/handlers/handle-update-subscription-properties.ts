import type { Request, Response } from "@tsonic/express/index.js";
import { getBodyObject } from "../helpers/body.ts";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { updateSubscriptionPropertiesDomain } from "@jotster/subscriptions/Jotster.Subscriptions.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleUpdateSubscriptionProperties = async (
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

  const subscriptionDataRaw = body["subscription_data"] as string;
  if (!subscriptionDataRaw) {
    res.status(400).json({ result: "error", msg: "Missing required field: subscription_data" });
    return;
  }

  const rawUpdates = JSON.parse(subscriptionDataRaw) as { stream_id: string; property: string; value: unknown }[];
  const updates = rawUpdates.map((update) => ({
    streamId: update.stream_id,
    property: update.property,
    propValue: String(update.value ?? ""),
  }));

  const result = await updateSubscriptionPropertiesDomain(app.options, user, updates);
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "" });
};
