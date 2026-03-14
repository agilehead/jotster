import type { Request, Response } from "@tsonic/express/index.js";
import type { NavigationView, Reminder, SavedSnippet, ScheduledMessage } from "@jotster/core/Jotster.Core.js";
import type { AppContext } from "../helpers/app-context.ts";
import {
  createNavigationView,
  createReminder,
  createSavedSnippet,
  createScheduledMessage,
  deleteNavigationView,
  deleteReminder,
  deleteSavedSnippet,
  deleteScheduledMessage,
  listNavigationViews,
  listReminders,
  listSavedSnippets,
  listScheduledMessages,
  updateNavigationView,
  updateSavedSnippet,
  updateScheduledMessage,
} from "../helpers/compat-db.ts";
import { getBodyObject, getOptionalBooleanField, getOptionalStringArrayField, getOptionalStringField } from "../helpers/body.ts";
import {
  mapNavigationViewToCompatResponse,
  mapReminderToCompatResponse,
  mapSavedSnippetToCompatResponse,
  mapScheduledMessageToCompatResponse,
} from "../helpers/compat-mappers.ts";
import { requireAuth } from "../helpers/require-auth.ts";

const getWildcardFragment = (req: Request): string => {
  const wildcard = req.params["0"] as string | undefined;
  if (wildcard !== undefined && wildcard.length > 0) {
    return wildcard;
  }

  const head = req.params["fragment_head"] as string | undefined;
  const tail = req.params["fragment_tail"] as string | undefined;
  const rest = req.params["fragment_rest"] as string | undefined;
  if (head !== undefined && tail !== undefined) {
    return rest !== undefined && rest.length > 0
      ? `${head}/${tail}/${rest}`
      : `${head}/${tail}`;
  }

  return (req.params["fragment"] as string | undefined) ?? "";
};

const mapNavigationViews = (views: NavigationView[]): Record<string, unknown>[] => {
  const result: Record<string, unknown>[] = [];
  for (let i = 0; i < views.length; i++) {
    result.push(mapNavigationViewToCompatResponse(views[i]));
  }
  return result;
};

const mapSavedSnippets = (snippets: SavedSnippet[]): Record<string, unknown>[] => {
  const result: Record<string, unknown>[] = [];
  for (let i = 0; i < snippets.length; i++) {
    result.push(mapSavedSnippetToCompatResponse(snippets[i]));
  }
  return result;
};

const mapReminders = (
  reminders: Reminder[],
  userId: string,
): Record<string, unknown>[] => {
  const result: Record<string, unknown>[] = [];
  for (let i = 0; i < reminders.length; i++) {
    result.push(mapReminderToCompatResponse(reminders[i], userId));
  }
  return result;
};

const mapScheduledMessages = (
  messages: ScheduledMessage[],
): Record<string, unknown>[] => {
  const result: Record<string, unknown>[] = [];
  for (let i = 0; i < messages.length; i++) {
    result.push(mapScheduledMessageToCompatResponse(messages[i]));
  }
  return result;
};

const getScheduledMessageRecipientText = (body: Record<string, unknown>): string | undefined => {
  return getOptionalStringField(body, "to");
};

const getScheduledMessageRecipientArray = (body: Record<string, unknown>): string[] | undefined => {
  return getOptionalStringArrayField(body, "to");
};

export const handleGetNavigationViewsCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }

  const views = await listNavigationViews(app.options, requester);
  res.json({
    result: "success",
    msg: "",
    navigation_views: mapNavigationViews(views),
  });
};

export const handleCreateNavigationViewCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }

  const body = getBodyObject(req);
  const fragment = getOptionalStringField(body, "fragment");
  if (fragment === undefined || fragment.trim().length === 0) {
    res.status(400).json({ result: "error", msg: "fragment cannot be blank", code: "BAD_REQUEST" });
    return;
  }

  const ok = await createNavigationView(
    app.options,
    requester,
    fragment,
    getOptionalBooleanField(body, "is_pinned") === true,
    getOptionalStringField(body, "name"),
  );
  if (!ok) {
    res.status(400).json({ result: "error", msg: "Navigation view already exists.", code: "BAD_REQUEST" });
    return;
  }

  res.json({ result: "success", msg: "" });
};

export const handleUpdateNavigationViewCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }

  const body = getBodyObject(req);
  const fragment = getWildcardFragment(req);
  const ok = await updateNavigationView(
    app.options,
    requester,
    fragment,
    getOptionalBooleanField(body, "is_pinned"),
    getOptionalStringField(body, "name"),
  );
  if (!ok) {
    res.status(404).json({ result: "error", msg: "Navigation view does not exist.", code: "BAD_REQUEST" });
    return;
  }

  res.json({ result: "success", msg: "" });
};

export const handleDeleteNavigationViewCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }

  const ok = await deleteNavigationView(app.options, requester, getWildcardFragment(req));
  if (!ok) {
    res.status(404).json({ result: "error", msg: "Navigation view does not exist.", code: "BAD_REQUEST" });
    return;
  }

  res.json({ result: "success", msg: "" });
};

export const handleGetSavedSnippetsCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }

  const snippets = await listSavedSnippets(app.options, requester);
  res.json({
    result: "success",
    msg: "",
    saved_snippets: mapSavedSnippets(snippets),
  });
};

export const handleCreateSavedSnippetCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }

  const body = getBodyObject(req);
  const title = getOptionalStringField(body, "title");
  const content = getOptionalStringField(body, "content");
  if (title === undefined || content === undefined) {
    res.status(400).json({ result: "error", msg: "Missing required field", code: "BAD_REQUEST" });
    return;
  }

  const snippetId = await createSavedSnippet(app.options, requester, title, content);
  if (snippetId === undefined) {
    res.status(400).json({ result: "error", msg: "Title cannot be empty.", code: "BAD_REQUEST" });
    return;
  }

  res.json({ result: "success", msg: "", saved_snippet_id: snippetId });
};

export const handleUpdateSavedSnippetCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }

  const body = getBodyObject(req);
  const ok = await updateSavedSnippet(
    app.options,
    requester,
    req.params["saved_snippet_id"] as string,
    getOptionalStringField(body, "title"),
    getOptionalStringField(body, "content"),
  );
  if (!ok) {
    res.status(404).json({ result: "error", msg: "Saved snippet does not exist.", code: "BAD_REQUEST" });
    return;
  }

  res.json({ result: "success", msg: "" });
};

export const handleDeleteSavedSnippetCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }

  const ok = await deleteSavedSnippet(app.options, requester, req.params["saved_snippet_id"] as string);
  if (!ok) {
    res.status(404).json({ result: "error", msg: "Saved snippet does not exist.", code: "BAD_REQUEST" });
    return;
  }

  res.json({ result: "success", msg: "" });
};

export const handleGetRemindersCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }

  const reminders = await listReminders(app.options, requester);
  res.json({
    result: "success",
    msg: "",
    reminders: mapReminders(reminders, requester.userId),
  });
};

export const handleCreateReminderCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }

  const body = getBodyObject(req);
  const messageId = getOptionalStringField(body, "message_id");
  const scheduledDeliveryTimestamp = getOptionalStringField(body, "scheduled_delivery_timestamp");
  if (messageId === undefined || scheduledDeliveryTimestamp === undefined) {
    res.status(400).json({ result: "error", msg: "Missing required field", code: "BAD_REQUEST" });
    return;
  }

  const reminderId = await createReminder(
    app.options,
    requester,
    messageId,
    scheduledDeliveryTimestamp,
    getOptionalStringField(body, "note"),
  );
  if (reminderId === undefined) {
    res.status(400).json({ result: "error", msg: "Invalid reminder request", code: "BAD_REQUEST" });
    return;
  }

  res.json({ result: "success", msg: "", reminder_id: reminderId });
};

export const handleDeleteReminderCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }

  const ok = await deleteReminder(app.options, requester, req.params["reminder_id"] as string);
  if (!ok) {
    res.status(404).json({ result: "error", msg: "Reminder does not exist", code: "BAD_REQUEST" });
    return;
  }

  res.json({ result: "success", msg: "" });
};

export const handleGetScheduledMessagesCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }

  const messages = await listScheduledMessages(app.options, requester);
  res.json({
    result: "success",
    msg: "",
    scheduled_messages: mapScheduledMessages(messages),
  });
};

export const handleCreateScheduledMessageCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }

  const body = getBodyObject(req);
  const type = getOptionalStringField(body, "type");
  const content = getOptionalStringField(body, "content");
  const scheduledDeliveryTimestamp = getOptionalStringField(body, "scheduled_delivery_timestamp");
  if (type === undefined || content === undefined || scheduledDeliveryTimestamp === undefined) {
    res.status(400).json({ result: "error", msg: "Missing required field", code: "BAD_REQUEST" });
    return;
  }

  const toValueText = getScheduledMessageRecipientText(body);
  const toValueArray = getScheduledMessageRecipientArray(body);
  const scheduledMessageId = await createScheduledMessage(
    app.options,
    requester,
    type,
    toValueText,
    toValueArray,
    content,
    getOptionalStringField(body, "topic"),
    scheduledDeliveryTimestamp,
  );
  if (scheduledMessageId === undefined) {
    res.status(400).json({ result: "error", msg: "Invalid scheduled message request", code: "BAD_REQUEST" });
    return;
  }

  res.json({ result: "success", msg: "", scheduled_message_id: scheduledMessageId });
};

export const handleUpdateScheduledMessageCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }

  const body = getBodyObject(req);
  const ok = await updateScheduledMessage(
    app.options,
    requester,
    req.params["scheduled_message_id"] as string,
    getOptionalStringField(body, "type"),
    getScheduledMessageRecipientText(body),
    getScheduledMessageRecipientArray(body),
    getOptionalStringField(body, "content"),
    getOptionalStringField(body, "topic"),
    getOptionalStringField(body, "scheduled_delivery_timestamp"),
  );
  if (!ok) {
    res.status(404).json({ result: "error", msg: "Scheduled message does not exist", code: "BAD_REQUEST" });
    return;
  }

  res.json({ result: "success", msg: "" });
};

export const handleDeleteScheduledMessageCompat = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const requester = await requireAuth(req, res, app);
  if (requester === undefined) {
    return;
  }

  const ok = await deleteScheduledMessage(app.options, requester, req.params["scheduled_message_id"] as string);
  if (!ok) {
    res.status(404).json({ result: "error", msg: "Scheduled message does not exist", code: "BAD_REQUEST" });
    return;
  }

  res.json({ result: "success", msg: "" });
};
