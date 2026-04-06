import type { JsValue } from "@tsonic/core/types.js";
import type {
  ChannelFolder,
  Linkifier,
  NavigationView,
  Reminder,
  SavedSnippet,
  ScheduledMessage,
} from "@jotster/core/Jotster.Core.js";
import { Convert, Math as ClrMath } from "@tsonic/dotnet/System.js";
import { parseJsonValueText } from "./body.ts";

const toUnixSeconds = (value: JsValue): number => {
  if (value === undefined || value === null) {
    return 0;
  }
  const parsed = Number(String(value));
  if (Number.isFinite(parsed)) {
    return ClrMath.Floor(parsed / 1000);
  }
  return 0;
};

const parseStringArray = (value: string | undefined): string[] => {
  if (value === undefined || value.trim().length === 0) {
    return [];
  }
  try {
    const parsed = parseJsonValueText(value);
    if (!Array.isArray(parsed)) {
      return [];
    }
    const entries = parsed as JsValue[];
    const result: string[] = [];
    for (let i = 0; i < entries.length; i++) {
      result.push(String(entries[i] ?? ""));
    }
    return result;
  } catch {
    return [];
  }
};

const parseIntArray = (value: string | undefined): number[] => {
  if (value === undefined || value.trim().length === 0) {
    return [];
  }
  try {
    const parsed = parseJsonValueText(value);
    if (!Array.isArray(parsed)) {
      return [];
    }
    const entries = parsed as JsValue[];
    const result: number[] = [];
    for (let i = 0; i < entries.length; i++) {
      const num = Number(entries[i]);
      if (!Number.isFinite(num)) {
        continue;
      }
      result.push(Convert.ToInt32(num));
    }
    return result;
  } catch {
    return [];
  }
};

const parseAlternativeUrlTemplates = (value: string | undefined): string[] => {
  return parseStringArray(value);
};

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const renderDescription = (value: string): string => {
  if (value.length === 0) {
    return "";
  }
  return `<p>${escapeHtml(value)}</p>`;
};

export const mapChannelFolderToCompatResponse = (
  folder: ChannelFolder,
): Record<string, JsValue> => ({
  id: folder.Id,
  name: folder.Name,
  order: folder.Ordering,
  date_created: toUnixSeconds(folder.CreatedAt),
  creator_id: folder.UserId,
  description: folder.Description,
  rendered_description: renderDescription(folder.Description),
  is_archived: folder.IsArchived === 1,
});

export const mapNavigationViewToCompatResponse = (
  view: NavigationView,
): Record<string, JsValue> => ({
  fragment: view.Fragment,
  is_pinned: view.IsPinned === 1,
  name: view.Name ?? null,
});

export const mapSavedSnippetToCompatResponse = (
  snippet: SavedSnippet,
): Record<string, JsValue> => ({
  id: snippet.Id,
  title: snippet.Title,
  content: snippet.Content,
  date_created: toUnixSeconds(snippet.CreatedAt),
});

export const mapReminderToCompatResponse = (
  reminder: Reminder,
  userId: number,
): Record<string, JsValue> => ({
  reminder_id: reminder.Id,
  type: "private",
  to: [userId],
  content: reminder.Content,
  rendered_content: reminder.RenderedContent,
  scheduled_delivery_timestamp: toUnixSeconds(
    reminder.ScheduledDeliveryTimestamp,
  ),
  failed: reminder.Failed === 1,
  reminder_target_message_id: reminder.MessageId,
});

export const mapScheduledMessageToCompatResponse = (
  scheduledMessage: ScheduledMessage,
): Record<string, JsValue> => {
  const response: Record<string, JsValue> = {
    scheduled_message_id: scheduledMessage.Id,
    type:
      scheduledMessage.Type === "direct" ? "private" : scheduledMessage.Type,
    to:
      scheduledMessage.Type === "stream"
        ? (scheduledMessage.ChannelId ?? null)
        : parseIntArray(scheduledMessage.RecipientIdsJson),
    content: scheduledMessage.Content,
    rendered_content: scheduledMessage.RenderedContent,
    scheduled_delivery_timestamp: toUnixSeconds(
      scheduledMessage.ScheduledDeliveryTimestamp,
    ),
    failed: scheduledMessage.Failed === 1,
  };

  if (scheduledMessage.Type === "stream") {
    response["topic"] = scheduledMessage.Topic ?? "";
  }

  return response;
};

export const mapLinkifierToCompatResponse = (
  linkifier: Linkifier,
): Record<string, JsValue> => ({
  pattern: linkifier.Pattern,
  url_template: linkifier.UrlTemplate,
  id: linkifier.Id,
  example_input: linkifier.ExampleInput ?? null,
  reverse_template: linkifier.ReverseTemplate ?? null,
  alternative_url_templates: parseAlternativeUrlTemplates(
    linkifier.AlternativeUrlTemplatesJson,
  ),
});
