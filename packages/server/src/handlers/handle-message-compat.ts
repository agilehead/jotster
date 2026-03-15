import type { int, long } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import { parseId } from "@jotster/core/Jotster.Core.js";
import type { AppContext } from "../helpers/app-context.ts";
import { reportMessageForModeration } from "../helpers/compat-db.ts";
import {
  getMessagesMatchingNarrow,
  markStreamAsRead,
  markTopicAsRead,
  updateFlagsForNarrow,
} from "../helpers/message-compat.ts";
import { getBodyObject, getOptionalIntField, getOptionalStringField, toOptionalStringArray, toLong} from "../helpers/body.ts";
import { requireAuth } from "../helpers/require-auth.ts";

const parseMessageIds = (value: unknown): long[] | undefined => {
  const strings = toOptionalStringArray(value);
  if (strings === undefined) {
    return undefined;
  }
  const result: long[] = [];
  for (let i = 0; i < strings.length; i++) {
    const parsed = parseId(strings[i]);
    if (parsed === undefined) {
      return undefined;
    }
    result.push(toLong(parsed));
  }
  return result;
};

const getObjectField = (value: unknown, key: string): unknown => {
  if (value === null || value === undefined || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  for (const [entryKey, entryValue] of Object.entries(value)) {
    if (entryKey === key) {
      return entryValue;
    }
  }
  return undefined;
};

export const handleMarkStreamAsReadCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }

  const body = getBodyObject(req);
  const streamIdStr = getOptionalStringField(body, "stream_id");
  const streamId = parseId(streamIdStr);
  if (streamId === undefined) {
    res.status(400).json({ result: "error", msg: "Missing required field: stream_id", code: "BAD_REQUEST" });
    return;
  }

  await markStreamAsRead(app.options, requester, toLong(streamId));
  res.json({ result: "success", msg: "" });
};

export const handleMarkTopicAsReadCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }

  const body = getBodyObject(req);
  const topicStreamIdStr = getOptionalStringField(body, "stream_id");
  const topicStreamId = parseId(topicStreamIdStr);
  const topicName = getOptionalStringField(body, "topic_name");
  if (topicStreamId === undefined || topicName === undefined) {
    res.status(400).json({ result: "error", msg: "Missing required field", code: "BAD_REQUEST" });
    return;
  }

  await markTopicAsRead(app.options, requester, toLong(topicStreamId), topicName);
  res.json({ result: "success", msg: "" });
};

export const handleUpdateMessageFlagsForNarrowCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }

  const body = getBodyObject(req);
  const anchor = getOptionalStringField(body, "anchor") ?? "newest";
  const numBefore = getOptionalIntField(body, "num_before") ?? (0 as int);
  const numAfter = getOptionalIntField(body, "num_after") ?? (0 as int);
  const op = getOptionalStringField(body, "op");
  const flag = getOptionalStringField(body, "flag");
  if (op === undefined || flag === undefined) {
    res.status(400).json({ result: "error", msg: "Missing required field", code: "BAD_REQUEST" });
    return;
  }

  const narrow = body["narrow"];
  const result = await updateFlagsForNarrow(app.options, requester, {
    anchor,
    includeAnchor: getOptionalStringField(body, "include_anchor") !== "false",
    numBefore,
    numAfter,
    narrow,
    op,
    flag,
  });
  if (result.error !== undefined || result.payload === undefined) {
    res.status(400).json({ result: "error", msg: result.error ?? "Invalid narrow", code: "BAD_REQUEST" });
    return;
  }

  const payload = result.payload;
  res.json({
    result: "success",
    msg: "",
    processed_count: getObjectField(payload, "processed_count"),
    updated_count: getObjectField(payload, "updated_count"),
    first_processed_id: getObjectField(payload, "first_processed_id"),
    last_processed_id: getObjectField(payload, "last_processed_id"),
    found_oldest: getObjectField(payload, "found_oldest"),
    found_newest: getObjectField(payload, "found_newest"),
    ignored_because_not_subscribed_channels: getObjectField(payload, "ignored_because_not_subscribed_channels") ?? [],
  });
};

export const handleMessagesMatchNarrowCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }

  const query = req.query as Record<string, unknown>;
  const messageIds = parseMessageIds(query["msg_ids"]);
  if (messageIds === undefined) {
    res.status(400).json({ result: "error", msg: "Invalid msg_ids", code: "BAD_REQUEST" });
    return;
  }

  const result = await getMessagesMatchingNarrow(app.options, requester, messageIds, query["narrow"]);
  if (result.error !== undefined || result.messagesJson === undefined) {
    res.status(400).json({ result: "error", msg: result.error ?? "Invalid narrow", code: "BAD_REQUEST" });
    return;
  }

  res
    .type("application/json")
    .send(`{"result":"success","msg":"","messages":${result.messagesJson}}`);
};

export const handleReportMessageCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }

  const body = getBodyObject(req);
  const reportType = getOptionalStringField(body, "report_type");
  if (reportType === undefined) {
    res.status(400).json({ result: "error", msg: "Missing report_type", code: "BAD_REQUEST" });
    return;
  }

  const reportMessageId = parseId(req.params["message_id"] as string);
  if (reportMessageId === undefined) {
    res.status(400).json({ result: "error", msg: "Invalid message_id", code: "BAD_REQUEST" });
    return;
  }
  const result = await reportMessageForModeration(
    app.options,
    requester,
    toLong(reportMessageId),
    reportType,
    getOptionalStringField(body, "description"),
  );
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error, code: "BAD_REQUEST" });
    return;
  }

  res.json({ result: "success", msg: "" });
};

export const handleMessageEditTypingCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }

  const body = getBodyObject(req);
  const op = getOptionalStringField(body, "op");
  if (op !== "start" && op !== "stop") {
    res.status(400).json({ result: "error", msg: "Invalid op", code: "BAD_REQUEST" });
    return;
  }

  res.json({ result: "success", msg: "" });
};

export const handleThumbnailStatusCompat = async (
  req: Request,
  res: Response,
  _app: AppContext,
): Promise<void> => {
  res.json({ result: "success", msg: "", has_thumbnail: false });
};
