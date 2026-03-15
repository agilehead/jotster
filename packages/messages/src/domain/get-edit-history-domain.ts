import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { Convert } from "@tsonic/dotnet/System.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { getMessage } from "../repo/get-message.ts";
import { getEditHistory } from "../repo/get-edit-history.ts";

export const getEditHistoryDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  messageId: long,
): Promise<Result<Record<string, unknown>[], string>> => {
  // Verify message exists in the tenant
  const message = await getMessage(options, user.tenantId, messageId);
  if (message === undefined) {
    return err("Message not found");
  }

  const history = await getEditHistory(options, user.tenantId, messageId);

  const formatted = new List<Record<string, unknown>>();
  for (let i = 0; i < history.length; i++) {
    const entry = history[i];
    const obj: Record<string, unknown> = {};
    obj["user_id"] = entry.UserId;
    obj["timestamp"] = Convert.ToDouble(entry.Timestamp) / 1000;

    if (entry.PrevContent !== undefined && entry.PrevContent !== null) {
      obj["prev_content"] = entry.PrevContent;
    }
    if (
      entry.PrevRenderedContent !== undefined &&
      entry.PrevRenderedContent !== null
    ) {
      obj["prev_rendered_content"] = entry.PrevRenderedContent;
    }
    if (entry.PrevTopic !== undefined && entry.PrevTopic !== null) {
      obj["prev_subject"] = entry.PrevTopic;
    }
    if (entry.PrevChannelId !== undefined && entry.PrevChannelId !== null) {
      obj["prev_stream"] = entry.PrevChannelId;
    }

    formatted.Add(obj);
  }

  return ok(formatted.ToArray());
};
