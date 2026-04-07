import type { JsValue } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { getChannelIdByName } from "@jotster/channels/Jotster.Channels.js";
import type { AppContext } from "../helpers/app-context.ts";
import { getOptionalStringField } from "../helpers/body.ts";

export const handleGetStreamId = async (
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
  const streamName = getOptionalStringField(
    req.query as Record<string, JsValue>,
    "stream",
  );

  if (!streamName) {
    res
      .status(400)
      .json({
        result: "error",
        msg: "Missing required parameter: stream",
        code: "BAD_REQUEST",
      });
    return;
  }

  const result = await getChannelIdByName(
    app.options,
    user.tenantId,
    streamName,
  );
  if (!result.success) {
    res
      .status(404)
      .json({ result: "error", msg: result.error, code: "BAD_REQUEST" });
    return;
  }

  const payload: Record<string, JsValue> = {};
  payload["result"] = "success";
  payload["msg"] = "";
  payload["stream_id"] = result.data;
  res.json(payload);
};
