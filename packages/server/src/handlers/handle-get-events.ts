import type { JsValue, int } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { getEventsFromQueue } from "@jotster/event-queue/Jotster.EventQueue.js";
import type { QueueEvent } from "@jotster/event-queue/Jotster.EventQueue.js";
import type { AppContext } from "../helpers/app-context.ts";
import {
  getOptionalStringField,
  toOptionalInt,
} from "../helpers/body.ts";

const serializeQueueEvent = (value: QueueEvent): Record<string, JsValue> => {
  const serialized: Record<string, JsValue> = {};

  serialized["id"] = value.id;
  serialized["type"] = value.type;
  if (value.op !== undefined && value.op !== null) {
    serialized["op"] = value.op;
  }

  const payload = value.data;
  if (!payload) {
    return serialized;
  }

  for (const [key, payloadValue] of Object.entries(payload)) {
    if (
      key === "op" &&
      serialized["op"] === undefined &&
      typeof payloadValue === "string"
    ) {
      serialized["op"] = payloadValue;
      continue;
    }
    serialized[key] = payloadValue;
  }

  return serialized;
};

export const handleGetEvents = async (
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
  const query = req.query as Record<string, JsValue>;

  const queueId = getOptionalStringField(query, "queue_id");
  if (!queueId) {
    res
      .status(400)
      .json({
        result: "error",
        msg: "Missing required parameter: queue_id",
        code: "BAD_REQUEST",
      });
    return;
  }

  const lastEventIdRaw = getOptionalStringField(query, "last_event_id");
  if (lastEventIdRaw === undefined) {
    res
      .status(400)
      .json({
        result: "error",
        msg: "Missing required parameter: last_event_id",
        code: "BAD_REQUEST",
      });
    return;
  }
  const lastEventId = toOptionalInt(lastEventIdRaw);
  if (lastEventId === undefined) {
    res
      .status(400)
      .json({
        result: "error",
        msg: "Invalid last_event_id",
        code: "BAD_REQUEST",
      });
    return;
  }

  const dontBlock = getOptionalStringField(query, "dont_block") === "true";

  const result = await getEventsFromQueue(
    user.tenantId,
    user.userId,
    queueId,
    lastEventId,
    dontBlock,
  );

  if ("error" in result) {
    const status = result["code"] === "BAD_EVENT_QUEUE_ID" ? 400 : 400;
    const resp: Record<string, JsValue> = {};
    resp["result"] = "error";
    resp["msg"] = result["error"];
    if (result["code"] !== undefined) {
      resp["code"] = result["code"];
      resp["queue_id"] = queueId;
    }
    res.status(status).json(resp);
    return;
  }

  const events = result["events"];
  const serializedEvents: Record<string, JsValue>[] = [];
  for (let i = 0; i < events.length; i++) {
    serializedEvents.push(serializeQueueEvent(events[i]!));
  }

  res.json({ result: "success", msg: "", events: serializedEvents });
};
