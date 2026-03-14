import type { int } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { getEventsFromQueue } from "@jotster/event-queue/Jotster.EventQueue.js";
import type { AppContext } from "../helpers/app-context.ts";
import { getOptionalStringField, toOptionalInt } from "../helpers/body.ts";

export const handleGetEvents = async (
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
  const query = req.query as Record<string, unknown>;

  const queueId = getOptionalStringField(query, "queue_id");
  if (!queueId) {
    res.status(400).json({ result: "error", msg: "Missing required parameter: queue_id", code: "BAD_REQUEST" });
    return;
  }

  const lastEventIdRaw = getOptionalStringField(query, "last_event_id");
  if (lastEventIdRaw === undefined) {
    res.status(400).json({ result: "error", msg: "Missing required parameter: last_event_id", code: "BAD_REQUEST" });
    return;
  }
  const lastEventId = toOptionalInt(lastEventIdRaw);
  if (lastEventId === undefined) {
    res.status(400).json({ result: "error", msg: "Invalid last_event_id", code: "BAD_REQUEST" });
    return;
  }

  const dontBlock = getOptionalStringField(query, "dont_block") === "true";

  const result = await getEventsFromQueue(user.tenantId, user.userId, queueId, lastEventId, dontBlock);

  if ("error" in result) {
    const status = result["code"] === "BAD_EVENT_QUEUE_ID" ? 400 : 400;
    const resp: Record<string, unknown> = {};
    resp["result"] = "error";
    resp["msg"] = result["error"];
    if (result["code"] !== undefined) {
      resp["code"] = result["code"];
      resp["queue_id"] = queueId;
    }
    res.status(status).json(resp);
    return;
  }

  res.json({ result: "success", msg: "", events: result["events"] });
};
