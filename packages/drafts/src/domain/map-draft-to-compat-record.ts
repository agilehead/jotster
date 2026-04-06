import type { Draft } from "@jotster/core/Jotster.Core.js";
import type { JsValue } from "@tsonic/core/types.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { Convert, Math as ClrMath } from "@tsonic/dotnet/System.js";

const parseRecipientIds = (value: string | undefined): string[] => {
  if (value === undefined || value.trim().length === 0) {
    return [];
  }

  try {
    const parsed: JsValue = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const items = parsed as JsValue[];
    const result = new List<string>();
    for (let i = 0; i < items.length; i++) {
      result.Add(String(items[i] ?? ""));
    }
    return result.ToArray();
  } catch {
    return [];
  }
};

export const mapDraftToCompatRecord = (
  draft: Draft,
): Record<string, JsValue> => {
  const record: Record<string, JsValue> = {};
  record["id"] = draft.Id;
  record["type"] = draft.Type;
  record["to"] =
    draft.Type === "stream"
      ? draft.ChannelId !== undefined
        ? [draft.ChannelId]
        : []
      : parseRecipientIds(draft.RecipientIdsJson);
  record["topic"] = draft.Topic ?? "";
  record["content"] = draft.Content;
  record["timestamp"] = ClrMath.Floor(Convert.ToDouble(draft.UpdatedAt) / 1000);
  return record;
};
