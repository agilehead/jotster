import type { JsValue } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import { getBodyObject, getOptionalStringField } from "../helpers/body.ts";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { deleteQueueById } from "@jotster/event-queue/Jotster.EventQueue.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleDeleteQueue = async (
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
  const body = getBodyObject(req);
  const query = req.query as Record<string, JsValue>;

  const queueId =
    getOptionalStringField(body, "queue_id") ??
    getOptionalStringField(query, "queue_id");
  if (!queueId) {
    res
      .status(400)
      .json({ result: "error", msg: "Missing required parameter: queue_id" });
    return;
  }

  const result = deleteQueueById(user.tenantId, user.userId, queueId);

  if (!result.success) {
    res
      .status(400)
      .json({ result: "error", msg: result.error ?? "Queue not found" });
    return;
  }

  res.json({ result: "success", msg: "" });
};
