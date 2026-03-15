import type { Request, Response } from "@tsonic/express/index.js";
import type { NavigationView, Reminder, SavedSnippet, ScheduledMessage } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToUser } from "@jotster/event-queue/Jotster.EventQueue.js";
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
import {
  getBodyObject,
  getOptionalBooleanField,
  getOptionalStringArrayField,
  getOptionalStringField,
  hasField,
} from "../helpers/body.ts";
import {
  mapNavigationViewToCompatResponse,
  mapReminderToCompatResponse,
  mapSavedSnippetToCompatResponse,
  mapScheduledMessageToCompatResponse,
} from "../helpers/compat-mappers.ts";
import { requireAuth } from "../helpers/require-auth.ts";

const getWildcardFragment = (req: Request): string => {
  const wildcard = req.params["0"] as string | undefined;
  const head = req.params["fragment_head"] as string | undefined;
  const tail = req.params["fragment_tail"] as string | undefined;
  const rest = req.params["fragment_rest"] as string | undefined;
  if (head !== undefined && tail !== undefined && wildcard !== undefined && wildcard.length > 0) {
    return `${head}/${tail}/${wildcard}`;
  }

  if (wildcard !== undefined && wildcard.length > 0) {
    return wildcard;
  }

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

const BUILT_IN_NAVIGATION_VIEW_FRAGMENTS = new Set<string>([
  "inbox",
  "recent",
  "feed",
  "drafts",
  "narrow/has/reaction/sender/me",
  "narrow/is/mentioned",
  "narrow/is/starred",
  "scheduled",
  "reminders",
]);

const SAVED_SNIPPET_MAX_TITLE_LENGTH = 60;

const getTrimmedOptionalString = (value: string | undefined): string | undefined => {
  if (value === undefined) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
};

const isBuiltInNavigationView = (fragment: string): boolean => {
  return BUILT_IN_NAVIGATION_VIEW_FRAGMENTS.has(fragment);
};

const isPastOrPresentUnixSeconds = (value: string): boolean => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return false;
  }
  return parsed <= Date.now() / 1000;
};

const hasEmailLikeRecipient = (
  toValueText: string | undefined,
  toValueArray: string[] | undefined,
): boolean => {
  if (toValueArray !== undefined) {
    for (let i = 0; i < toValueArray.length; i++) {
      if (toValueArray[i].includes("@")) {
        return true;
      }
    }
  }

  if (toValueText === undefined) {
    return false;
  }

  if (toValueText.includes("@")) {
    return true;
  }

  try {
    const parsed = JSON.parse(toValueText) as unknown;
    if (!Array.isArray(parsed)) {
      return false;
    }
    const entries = parsed as unknown[];
    for (let i = 0; i < entries.length; i++) {
      if (typeof entries[i] === "string" && (entries[i] as string).includes("@")) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
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
  const fragment = getTrimmedOptionalString(getOptionalStringField(body, "fragment"));
  if (fragment === undefined) {
    res.status(400).json({ result: "error", msg: "fragment cannot be blank", code: "BAD_REQUEST" });
    return;
  }

  const name = getTrimmedOptionalString(getOptionalStringField(body, "name"));
  if (isBuiltInNavigationView(fragment)) {
    if (name !== undefined) {
      res.status(400).json({ result: "error", msg: "Built-in views cannot have a custom name.", code: "BAD_REQUEST" });
      return;
    }
  } else if (name === undefined) {
    res.status(400).json({ result: "error", msg: "Custom views must have a valid name.", code: "BAD_REQUEST" });
    return;
  }

  const existingViews = await listNavigationViews(app.options, requester);
  for (let i = 0; i < existingViews.length; i++) {
    const existing = existingViews[i];
    if (existing.Fragment === fragment || (name !== undefined && existing.Name === name)) {
      res.status(400).json({ result: "error", msg: "Navigation view already exists.", code: "BAD_REQUEST" });
      return;
    }
  }

  const ok = await createNavigationView(
    app.options,
    requester,
    fragment,
    getOptionalBooleanField(body, "is_pinned") === true,
    name,
  );
  if (!ok) {
    res.status(400).json({ result: "error", msg: "Navigation view already exists.", code: "BAD_REQUEST" });
    return;
  }

  const createdViews = await listNavigationViews(app.options, requester);
  for (let i = 0; i < createdViews.length; i++) {
    if (createdViews[i].Fragment === fragment) {
      dispatchEventToUser(requester.tenantId, requester.userId, {
        type: "navigation_view",
        op: "add",
        data: {
          navigation_view: mapNavigationViewToCompatResponse(createdViews[i]),
        },
      });
      break;
    }
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
  const providedName = getOptionalStringField(body, "name");
  const name = getTrimmedOptionalString(providedName);
  if (isBuiltInNavigationView(fragment) && name !== undefined) {
    res.status(400).json({ result: "error", msg: "Built-in views cannot have a custom name.", code: "BAD_REQUEST" });
    return;
  }
  if (name !== undefined) {
    const existingViews = await listNavigationViews(app.options, requester);
    for (let i = 0; i < existingViews.length; i++) {
      const existing = existingViews[i];
      if (existing.Fragment !== fragment && existing.Name === name) {
        res.status(400).json({ result: "error", msg: "Navigation view already exists.", code: "BAD_REQUEST" });
        return;
      }
    }
  }
  const ok = await updateNavigationView(
    app.options,
    requester,
    fragment,
    getOptionalBooleanField(body, "is_pinned"),
    name,
  );
  if (!ok) {
    res.status(404).json({ result: "error", msg: "Navigation view does not exist.", code: "NOT_FOUND" });
    return;
  }

  const updatedViews = await listNavigationViews(app.options, requester);
  for (let i = 0; i < updatedViews.length; i++) {
    if (updatedViews[i].Fragment === fragment) {
      const data: Record<string, unknown> = {};
      if (hasField(body, "is_pinned")) {
        data.is_pinned = updatedViews[i].IsPinned === 1;
      }
      if (hasField(body, "name")) {
        data.name = updatedViews[i].Name ?? null;
      }
      dispatchEventToUser(requester.tenantId, requester.userId, {
        type: "navigation_view",
        op: "update",
        data: {
          fragment,
          data,
        },
      });
      break;
    }
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

  const fragment = getWildcardFragment(req);
  const ok = await deleteNavigationView(app.options, requester, fragment);
  if (!ok) {
    res.status(404).json({ result: "error", msg: "Navigation view does not exist.", code: "BAD_REQUEST" });
    return;
  }

  dispatchEventToUser(requester.tenantId, requester.userId, {
    type: "navigation_view",
    op: "remove",
    data: {
      fragment,
    },
  });

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
  const title = getTrimmedOptionalString(getOptionalStringField(body, "title"));
  const content = getTrimmedOptionalString(getOptionalStringField(body, "content"));
  if (title === undefined || content === undefined) {
    res.status(400).json({ result: "error", msg: "Missing required field", code: "BAD_REQUEST" });
    return;
  }
  if (title.length > SAVED_SNIPPET_MAX_TITLE_LENGTH) {
    res.status(400).json({
      result: "error",
      msg: `title is too long (limit: ${SAVED_SNIPPET_MAX_TITLE_LENGTH} characters)`,
      code: "BAD_REQUEST",
    });
    return;
  }

  const snippetId = await createSavedSnippet(app.options, requester, title, content);
  if (snippetId === undefined) {
    res.status(400).json({ result: "error", msg: "Title cannot be empty.", code: "BAD_REQUEST" });
    return;
  }

  const createdSnippets = await listSavedSnippets(app.options, requester);
  for (let i = 0; i < createdSnippets.length; i++) {
    if (createdSnippets[i].Id === snippetId) {
      dispatchEventToUser(requester.tenantId, requester.userId, {
        type: "saved_snippets",
        op: "add",
        data: {
          saved_snippet: mapSavedSnippetToCompatResponse(createdSnippets[i]),
        },
      });
      break;
    }
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
  const title = getTrimmedOptionalString(getOptionalStringField(body, "title"));
  if (title !== undefined && title.length > SAVED_SNIPPET_MAX_TITLE_LENGTH) {
    res.status(400).json({
      result: "error",
      msg: `title is too long (limit: ${SAVED_SNIPPET_MAX_TITLE_LENGTH} characters)`,
      code: "BAD_REQUEST",
    });
    return;
  }
  const snippetId = req.params["saved_snippet_id"] as string;
  const ok = await updateSavedSnippet(
    app.options,
    requester,
    snippetId,
    title,
    getTrimmedOptionalString(getOptionalStringField(body, "content")),
  );
  if (!ok) {
    res.status(404).json({ result: "error", msg: "Saved snippet does not exist.", code: "BAD_REQUEST" });
    return;
  }

  const updatedSnippets = await listSavedSnippets(app.options, requester);
  for (let i = 0; i < updatedSnippets.length; i++) {
    if (updatedSnippets[i].Id === snippetId) {
      dispatchEventToUser(requester.tenantId, requester.userId, {
        type: "saved_snippets",
        op: "update",
        data: {
          saved_snippet: mapSavedSnippetToCompatResponse(updatedSnippets[i]),
        },
      });
      break;
    }
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

  const snippetId = req.params["saved_snippet_id"] as string;
  const ok = await deleteSavedSnippet(app.options, requester, snippetId);
  if (!ok) {
    res.status(404).json({ result: "error", msg: "Saved snippet does not exist.", code: "BAD_REQUEST" });
    return;
  }

  dispatchEventToUser(requester.tenantId, requester.userId, {
    type: "saved_snippets",
    op: "remove",
    data: {
      saved_snippet_id: snippetId,
    },
  });

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
  if (isPastOrPresentUnixSeconds(scheduledDeliveryTimestamp)) {
    res.status(400).json({ result: "error", msg: "Scheduled delivery time must be in the future.", code: "BAD_REQUEST" });
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
    res.status(400).json({ result: "error", msg: "Invalid message(s)", code: "BAD_REQUEST" });
    return;
  }

  const reminders = await listReminders(app.options, requester);
  for (let i = 0; i < reminders.length; i++) {
    if (reminders[i].Id === reminderId) {
      dispatchEventToUser(requester.tenantId, requester.userId, {
        type: "reminders",
        op: "add",
        data: {
          reminders: [mapReminderToCompatResponse(reminders[i], requester.userId)],
        },
      });
      break;
    }
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

  const reminderId = req.params["reminder_id"] as string;
  const ok = await deleteReminder(app.options, requester, reminderId);
  if (!ok) {
    res.status(404).json({ result: "error", msg: "Reminder does not exist", code: "BAD_REQUEST" });
    return;
  }

  dispatchEventToUser(requester.tenantId, requester.userId, {
    type: "reminders",
    op: "remove",
    data: {
      reminder_id: reminderId,
    },
  });

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
  if (isPastOrPresentUnixSeconds(scheduledDeliveryTimestamp)) {
    res.status(400).json({ result: "error", msg: "Scheduled delivery time must be in the future.", code: "BAD_REQUEST" });
    return;
  }

  const toValueText = getScheduledMessageRecipientText(body);
  const toValueArray = getScheduledMessageRecipientArray(body);
  const normalizedType = type === "channel" ? "stream" : (type === "private" ? "direct" : type);
  if (normalizedType === "direct" && hasEmailLikeRecipient(toValueText, toValueArray)) {
    res.status(400).json({ result: "error", msg: 'to["int"] is not an integer', code: "BAD_REQUEST" });
    return;
  }
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
  if (!scheduledMessageId.ok && scheduledMessageId.errorCode === "invalid_stream") {
    res.status(400).json({
      result: "error",
      msg: `Channel with ID '${scheduledMessageId.streamId}' does not exist`,
      code: "STREAM_DOES_NOT_EXIST",
      stream_id: scheduledMessageId.streamId,
    });
    return;
  }
  if (!scheduledMessageId.ok && scheduledMessageId.errorCode === "invalid_user") {
    res.status(400).json({
      result: "error",
      msg: `Invalid user ID ${scheduledMessageId.userId}`,
      code: "BAD_REQUEST",
    });
    return;
  }
  if (!scheduledMessageId.ok) {
    res.status(400).json({ result: "error", msg: "Invalid scheduled message request", code: "BAD_REQUEST" });
    return;
  }

  const createdMessages = await listScheduledMessages(app.options, requester);
  for (let i = 0; i < createdMessages.length; i++) {
    if (createdMessages[i].Id === scheduledMessageId.scheduledMessageId) {
      dispatchEventToUser(requester.tenantId, requester.userId, {
        type: "scheduled_messages",
        op: "add",
        data: {
          scheduled_messages: [mapScheduledMessageToCompatResponse(createdMessages[i])],
        },
      });
      break;
    }
  }

  res.json({ result: "success", msg: "", scheduled_message_id: scheduledMessageId.scheduledMessageId });
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
  const hasType = hasField(body, "type");
  const hasTo = hasField(body, "to");
  const hasTopic = hasField(body, "topic");
  const hasContent = hasField(body, "content");
  const hasScheduledDeliveryTimestamp = hasField(body, "scheduled_delivery_timestamp");
  if (!hasType && !hasTo && !hasTopic && !hasContent && !hasScheduledDeliveryTimestamp) {
    res.status(400).json({ result: "error", msg: "Nothing to change", code: "BAD_REQUEST" });
    return;
  }

  const type = getOptionalStringField(body, "type");
  if (type !== undefined && !hasTo) {
    res.status(400).json({ result: "error", msg: "Recipient required when updating type of scheduled message.", code: "BAD_REQUEST" });
    return;
  }

  const normalizedType = type === "channel" ? "stream" : (type === "private" ? "direct" : type);
  if (normalizedType === "stream" && type !== undefined && !hasTopic) {
    res.status(400).json({ result: "error", msg: "Topic required when updating scheduled message type to channel.", code: "BAD_REQUEST" });
    return;
  }

  const toValueText = getScheduledMessageRecipientText(body);
  const toValueArray = getScheduledMessageRecipientArray(body);
  if (normalizedType === "direct" && (toValueText !== undefined || toValueArray !== undefined) && hasEmailLikeRecipient(toValueText, toValueArray)) {
    res.status(400).json({ result: "error", msg: 'to["int"] is not an integer', code: "BAD_REQUEST" });
    return;
  }

  const scheduledDeliveryTimestamp = getOptionalStringField(body, "scheduled_delivery_timestamp");
  if (scheduledDeliveryTimestamp !== undefined && isPastOrPresentUnixSeconds(scheduledDeliveryTimestamp)) {
    res.status(400).json({ result: "error", msg: "Scheduled delivery time must be in the future.", code: "BAD_REQUEST" });
    return;
  }

  const scheduledMessageId = req.params["scheduled_message_id"] as string;
  const ok = await updateScheduledMessage(
    app.options,
    requester,
    scheduledMessageId,
    type,
    toValueText,
    toValueArray,
    getOptionalStringField(body, "content"),
    getOptionalStringField(body, "topic"),
    scheduledDeliveryTimestamp,
  );
  if (!ok.ok && ok.errorCode === "invalid_stream") {
    res.status(400).json({
      result: "error",
      msg: `Channel with ID '${ok.streamId}' does not exist`,
      code: "STREAM_DOES_NOT_EXIST",
      stream_id: ok.streamId,
    });
    return;
  }
  if (!ok.ok && ok.errorCode === "invalid_user") {
    res.status(400).json({
      result: "error",
      msg: `Invalid user ID ${ok.userId}`,
      code: "BAD_REQUEST",
    });
    return;
  }
  if (!ok.ok && ok.notFound === true) {
    res.status(404).json({ result: "error", msg: "Scheduled message does not exist", code: "BAD_REQUEST" });
    return;
  }
  if (!ok.ok) {
    res.status(400).json({ result: "error", msg: "Invalid scheduled message request", code: "BAD_REQUEST" });
    return;
  }

  const updatedMessages = await listScheduledMessages(app.options, requester);
  for (let i = 0; i < updatedMessages.length; i++) {
    if (updatedMessages[i].Id === scheduledMessageId) {
      dispatchEventToUser(requester.tenantId, requester.userId, {
        type: "scheduled_messages",
        op: "update",
        data: {
          scheduled_message: mapScheduledMessageToCompatResponse(updatedMessages[i]),
        },
      });
      break;
    }
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

  const scheduledMessageId = req.params["scheduled_message_id"] as string;
  const ok = await deleteScheduledMessage(app.options, requester, scheduledMessageId);
  if (!ok) {
    res.status(404).json({ result: "error", msg: "Scheduled message does not exist", code: "BAD_REQUEST" });
    return;
  }

  dispatchEventToUser(requester.tenantId, requester.userId, {
    type: "scheduled_messages",
    op: "remove",
    data: {
      scheduled_message_id: scheduledMessageId,
    },
  });

  res.json({ result: "success", msg: "" });
};
