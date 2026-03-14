import type { Request, Response } from "@tsonic/express/index.js";
import { createChannelFolderDomain } from "@jotster/channels/Jotster.Channels.js";
import type { AppContext } from "../helpers/app-context.ts";
import { deleteTopicMessages, getStreamEmailAddress, reorderChannelFolders } from "../helpers/compat-db.ts";
import { getBodyObject, getOptionalStringField, toOptionalStringArray } from "../helpers/body.ts";
import { requireAuth } from "../helpers/require-auth.ts";

const parseOrder = (value: unknown): string[] | undefined => {
  if (Array.isArray(value)) {
    const values = value as unknown[];
    const result: string[] = [];
    for (let i = 0; i < values.length; i++) {
      result.push(`${values[i] ?? ""}`);
    }
    return result;
  }
  return toOptionalStringArray(value);
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
    res.status(400).json({ result: "error", msg: "Must be an organization administrator", code: "UNAUTHORIZED_PRINCIPAL" });
    return;
  }

  const body = getBodyObject(req);
  const name = getOptionalStringField(body, "name");
  if (name === undefined || name.trim().length === 0) {
    res.status(400).json({ result: "error", msg: "Missing required field: name", code: "BAD_REQUEST" });
    return;
  }

  const createResult = await createChannelFolderDomain(app.options, requester, {
    name,
    description: getOptionalStringField(body, "description"),
  });
  if (!createResult.success) {
    if (createResult.error === "Must be an organization administrator") {
      res.status(400).json({ result: "error", msg: createResult.error, code: "UNAUTHORIZED_PRINCIPAL" });
      return;
    }
    res.status(400).json({ result: "error", msg: createResult.error, code: "BAD_REQUEST" });
    return;
  }

  res.json({ result: "success", msg: "", channel_folder_id: createResult.data.Id });
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
    res.status(400).json({ result: "error", msg: "Must be an organization administrator", code: "UNAUTHORIZED_PRINCIPAL" });
    return;
  }

  const body = getBodyObject(req);
  const order = parseOrder(body["order"]);
  if (order === undefined || order.length === 0) {
    res.status(400).json({ result: "error", msg: "Invalid order mapping", code: "BAD_REQUEST" });
    return;
  }

  const ok = await reorderChannelFolders(app.options, requester, order);
  if (!ok) {
    res.status(400).json({ result: "error", msg: "Invalid order mapping", code: "BAD_REQUEST" });
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

  const emailAddress = await getStreamEmailAddress(app.options, requester.tenantId, req.params["stream_id"] as string);
  if (emailAddress === undefined) {
    res.status(400).json({ result: "error", msg: "Invalid channel", code: "BAD_REQUEST" });
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
  const topicName = getOptionalStringField(body, "topic_name") ?? getOptionalStringField(body, "topic");
  if (topicName === undefined) {
    res.status(400).json({ result: "error", msg: "Missing required field: topic_name", code: "BAD_REQUEST" });
    return;
  }

  const complete = await deleteTopicMessages(
    app.options,
    requester.tenantId,
    req.params["stream_id"] as string,
    topicName,
  );
  if (!complete) {
    res.status(400).json({ result: "error", msg: "Invalid channel", code: "BAD_REQUEST" });
    return;
  }

  res.json({ result: "success", msg: "", complete: true });
};
