import type { Request, Response } from "@tsonic/express/index.js";
import type { Linkifier } from "@jotster/core/Jotster.Core.js";
import type { AppContext } from "../helpers/app-context.ts";
import {
  createLinkifier,
  listLinkifiers,
  reorderCustomProfileFields,
  reorderLinkifiers,
  sendWelcomeBotTestMessage,
  updateLinkifier,
  deleteLinkifier,
} from "../helpers/compat-db.ts";
import { getBodyObject, getOptionalStringArrayField, getOptionalStringField } from "../helpers/body.ts";
import { mapLinkifierToCompatResponse } from "../helpers/compat-mappers.ts";
import { requireAuth } from "../helpers/require-auth.ts";

const normalizeFilterId = (filterId: string): string => filterId;
const getAlternativeUrlTemplatesJson = (body: Record<string, unknown>): string => {
  const explicit = getOptionalStringField(body, "alternative_url_templates");
  if (explicit !== undefined) {
    return explicit;
  }
  const values = getOptionalStringArrayField(body, "alternative_url_templates");
  return JSON.stringify(values ?? ([] as string[]));
};

const mapLinkifiers = (entries: Linkifier[]): Record<string, unknown>[] => {
  const result: Record<string, unknown>[] = [];
  for (let i = 0; i < entries.length; i++) {
    result.push(mapLinkifierToCompatResponse(entries[i]));
  }
  return result;
};

export const handleReorderProfileFieldsCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }

  const body = getBodyObject(req);
  const order = getOptionalStringArrayField(body, "order");
  if (order === undefined || order.length === 0) {
    res.status(400).json({ result: "error", msg: "Missing order", code: "BAD_REQUEST" });
    return;
  }

  const ok = await reorderCustomProfileFields(app.options, requester.tenantId, order);
  if (!ok) {
    res.status(400).json({ result: "error", msg: "Invalid order mapping", code: "BAD_REQUEST" });
    return;
  }

  res.json({ result: "success", msg: "" });
};

export const handleGetLinkifiersCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }

  const linkifiers = await listLinkifiers(app.options, requester.tenantId);
  res.json({
    result: "success",
    msg: "",
    linkifiers: mapLinkifiers(linkifiers),
  });
};

export const handleReorderLinkifiersCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }

  const body = getBodyObject(req);
  const orderedIds = getOptionalStringArrayField(body, "ordered_linkifier_ids");
  if (orderedIds === undefined || orderedIds.length === 0) {
    res.status(400).json({ result: "error", msg: "Missing ordered_linkifier_ids", code: "BAD_REQUEST" });
    return;
  }

  const ok = await reorderLinkifiers(app.options, requester.tenantId, orderedIds);
  if (!ok) {
    res.status(400).json({ result: "error", msg: "Invalid order mapping", code: "BAD_REQUEST" });
    return;
  }

  res.json({ result: "success", msg: "" });
};

export const handleCreateLinkifierCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }

  const body = getBodyObject(req);
  const pattern = getOptionalStringField(body, "pattern");
  const urlTemplate = getOptionalStringField(body, "url_template");
  if (pattern === undefined || urlTemplate === undefined) {
    res.status(400).json({ result: "error", msg: "Missing required field", code: "BAD_REQUEST" });
    return;
  }

  const id = await createLinkifier(
    app.options,
    requester.tenantId,
    pattern,
    urlTemplate,
    getOptionalStringField(body, "example_input"),
    getOptionalStringField(body, "reverse_template"),
    getAlternativeUrlTemplatesJson(body),
  );
  if (id === undefined) {
    res.status(400).json({ result: "error", msg: "Invalid linkifier", code: "BAD_REQUEST" });
    return;
  }

  res.json({ result: "success", msg: "", id });
};

export const handleUpdateLinkifierCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }

  const body = getBodyObject(req);
  const ok = await updateLinkifier(app.options, requester.tenantId, normalizeFilterId(req.params["filter_id"] as string), {
    pattern: getOptionalStringField(body, "pattern"),
    urlTemplate: getOptionalStringField(body, "url_template"),
    exampleInput: getOptionalStringField(body, "example_input"),
    reverseTemplate: getOptionalStringField(body, "reverse_template"),
    alternativeUrlTemplatesJson: getAlternativeUrlTemplatesJson(body),
  });
  if (!ok) {
    res.status(404).json({ result: "error", msg: "Linkifier does not exist.", code: "BAD_REQUEST" });
    return;
  }

  res.json({ result: "success", msg: "" });
};

export const handleDeleteLinkifierCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }

  const ok = await deleteLinkifier(app.options, requester.tenantId, normalizeFilterId(req.params["filter_id"] as string));
  if (!ok) {
    res.status(404).json({ result: "error", msg: "Linkifier does not exist.", code: "BAD_REQUEST" });
    return;
  }

  res.json({ result: "success", msg: "" });
};

export const handleTestWelcomeBotCustomMessageCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }

  const body = getBodyObject(req);
  const text = getOptionalStringField(body, "welcome_message_custom_text");
  if (text === undefined) {
    res.status(400).json({ result: "error", msg: "Missing welcome_message_custom_text", code: "BAD_REQUEST" });
    return;
  }

  const messageId = await sendWelcomeBotTestMessage(app.options, requester, text);
  if (messageId === undefined) {
    res.status(400).json({ result: "error", msg: "Failed to send test message", code: "BAD_REQUEST" });
    return;
  }

  res.json({ result: "success", msg: "", message_id: messageId });
};
