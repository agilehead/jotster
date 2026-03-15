import type { long } from "@tsonic/core/types.js";
import { Convert } from "@tsonic/dotnet/System.js";
import type { Request, Response } from "@tsonic/express/index.js";
import { createChannelFolderDomain } from "@jotster/channels/Jotster.Channels.js";
import { parseId } from "@jotster/core/Jotster.Core.js";
import type { AppContext } from "../helpers/app-context.ts";
import {
  deleteTopicMessages,
  getStreamEmailAddress,
  reorderChannelFolders,
} from "../helpers/compat-db.ts";
import {
  getBodyObject,
  getOptionalStringField,
  toOptionalStringArray,
  toLong,
} from "../helpers/body.ts";
import { requireAuth } from "../helpers/require-auth.ts";

const parseOrder = (value: unknown): long[] | undefined => {
  const strings = toOptionalStringArray(value);
  if (strings === undefined) {
    if (Array.isArray(value)) {
      const values = value as unknown[];
      const result: long[] = [];
      for (let i = 0; i < values.length; i++) {
        const parsed = parseInt(`${values[i] ?? ""}`);
        if (isNaN(parsed) || parsed < 1) {
          return undefined;
        }
        result.push(Convert.ToInt64(parsed));
      }
      return result;
    }
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

export const handleCreateChannelFolderCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }
  if (requester.role > 200) {
    res
      .status(400)
      .json({
        result: "error",
        msg: "Must be an organization administrator",
        code: "UNAUTHORIZED_PRINCIPAL",
      });
    return;
  }

  const body = getBodyObject(req);
  const name = getOptionalStringField(body, "name");
  if (name === undefined || name.trim().length === 0) {
    res
      .status(400)
      .json({
        result: "error",
        msg: "Missing required field: name",
        code: "BAD_REQUEST",
      });
    return;
  }

  const createResult = await createChannelFolderDomain(app.options, requester, {
    name,
    description: getOptionalStringField(body, "description"),
  });
  if (!createResult.success) {
    if (createResult.error === "Must be an organization administrator") {
      res
        .status(400)
        .json({
          result: "error",
          msg: createResult.error,
          code: "UNAUTHORIZED_PRINCIPAL",
        });
      return;
    }
    res
      .status(400)
      .json({ result: "error", msg: createResult.error, code: "BAD_REQUEST" });
    return;
  }

  res.json({
    result: "success",
    msg: "",
    channel_folder_id: createResult.data.Id,
  });
};

export const handleReorderChannelFoldersCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }

  if (requester.role > 200) {
    res
      .status(400)
      .json({
        result: "error",
        msg: "Must be an organization administrator",
        code: "UNAUTHORIZED_PRINCIPAL",
      });
    return;
  }

  const body = getBodyObject(req);
  const order = parseOrder(body["order"]);
  if (order === undefined || order.length === 0) {
    res
      .status(400)
      .json({
        result: "error",
        msg: "Invalid order mapping",
        code: "BAD_REQUEST",
      });
    return;
  }

  const ok = await reorderChannelFolders(app.options, requester, order);
  if (!ok) {
    res
      .status(400)
      .json({
        result: "error",
        msg: "Invalid order mapping",
        code: "BAD_REQUEST",
      });
    return;
  }

  res.json({ result: "success", msg: "" });
};

export const handleGetStreamEmailAddressCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }

  const streamId = parseId(req.params["stream_id"] as string);
  if (streamId === undefined) {
    res
      .status(400)
      .json({ result: "error", msg: "Invalid channel", code: "BAD_REQUEST" });
    return;
  }
  const emailAddress = await getStreamEmailAddress(
    app.options,
    requester.tenantId,
    toLong(streamId),
  );
  if (emailAddress === undefined) {
    res
      .status(400)
      .json({ result: "error", msg: "Invalid channel", code: "BAD_REQUEST" });
    return;
  }

  res.json({ result: "success", msg: "", email_address: emailAddress });
};

export const handleDeleteTopicCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }

  const body = getBodyObject(req);
  const topicName =
    getOptionalStringField(body, "topic_name") ??
    getOptionalStringField(body, "topic");
  if (topicName === undefined) {
    res
      .status(400)
      .json({
        result: "error",
        msg: "Missing required field: topic_name",
        code: "BAD_REQUEST",
      });
    return;
  }

  const deleteStreamId = parseId(req.params["stream_id"] as string);
  if (deleteStreamId === undefined) {
    res
      .status(400)
      .json({ result: "error", msg: "Invalid channel", code: "BAD_REQUEST" });
    return;
  }
  const complete = await deleteTopicMessages(
    app.options,
    requester.tenantId,
    toLong(deleteStreamId),
    topicName,
  );
  if (!complete) {
    res
      .status(400)
      .json({ result: "error", msg: "Invalid channel", code: "BAD_REQUEST" });
    return;
  }

  res.json({ result: "success", msg: "", complete: true });
};
