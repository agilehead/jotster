import type { Draft } from "@jotster/core/Jotster.Core.js";
import { Convert, Math as ClrMath } from "@tsonic/dotnet/System.js";

const parseRecipientIds = (value: string | undefined): string[] => {
  if (value === undefined || value.trim().length === 0) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    const items = parsed as unknown[];
    const result: string[] = [];
    for (let i = 0; i < items.length; i++) {
      result.push(`${items[i] ?? ""}`);
    }
    return result;
  } catch {
    return [];
  }
};

export const mapDraftToCompatRecord = (draft: Draft): Record<string, unknown> => {
  const record: Record<string, unknown> = {};
  record["id"] = draft.Id;
  record["type"] = draft.Type;
  record["to"] = draft.Type === "stream"
    ? (draft.ChannelId !== undefined ? [draft.ChannelId] : [])
    : parseRecipientIds(draft.RecipientIdsJson);
  record["topic"] = draft.Topic ?? "";
  record["content"] = draft.Content;
  record["timestamp"] = ClrMath.Floor(Convert.ToDouble(draft.UpdatedAt) / 1000);
  return record;
};
