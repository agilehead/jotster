import type { JsValue } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { getUserChannelsDomain } from "@jotster/subscriptions/Jotster.Subscriptions.js";
import { parseId } from "@jotster/core/Jotster.Core.js";
import type { AppContext } from "../helpers/app-context.ts";
import { getOptionalStringField, toLong } from "../helpers/body.ts";

export const handleGetUserChannels = async (
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
  const targetUserId = parseId(req.param("user_id") ?? "");
  if (targetUserId === undefined) {
    res.status(400).json({ result: "error", msg: "Invalid user_id" });
    return;
  }
  const includeSubscribers =
    (getOptionalStringField(
      req.query as Record<string, JsValue>,
      "include_subscribers",
    ) ?? "0") === "1";

  const result = await getUserChannelsDomain(
    app.options,
    user,
    toLong(targetUserId),
    includeSubscribers,
  );
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  const subscribedChannelIds: JsValue[] = [];
  for (let i = 0; i < result.data.length; i++) {
    const entry = result.data[i];
    const streamId = entry["stream_id"];
    if (streamId !== undefined && streamId !== null) {
      subscribedChannelIds.push(streamId);
    }
  }

  res.json({
    result: "success",
    msg: "",
    subscribed_channel_ids: subscribedChannelIds,
  });
};
