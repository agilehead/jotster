import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { getSubscriptionsDomain } from "@jotster/subscriptions/Jotster.Subscriptions.js";
import type { AppContext } from "../helpers/app-context.ts";
import { getOptionalStringField } from "../helpers/body.ts";

export const handleGetSubscriptions = async (
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
  const includeSubscribers =
    (getOptionalStringField(
      req.query as Record<string, unknown>,
      "include_subscribers",
    ) ?? "1") === "1";

  const result = await getSubscriptionsDomain(
    app.options,
    user,
    includeSubscribers,
  );
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  const payload: Record<string, unknown> = {};
  payload["result"] = "success";
  payload["msg"] = "";
  payload["subscriptions"] = result.data;
  res.json(payload);
};
