import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { Convert } from "@tsonic/dotnet/System.js";
import { getDrafts } from "../repo/get-drafts.ts";

export const getDraftsDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser
): Promise<Result<Record<string, unknown>[], string>> => {
  const drafts = await getDrafts(options, user.tenantId, user.userId);

  const formatted = new List<Record<string, unknown>>();
  for (let i = 0; i < drafts.length; i++) {
    const draft = drafts[i];
    const obj: Record<string, unknown> = {};
    obj["id"] = draft.Id;
    obj["type"] = draft.Type;
    obj["to"] = draft.Type === "stream" ? (draft.ChannelId ?? "") : (draft.RecipientIdsJson ?? "[]");
    obj["topic"] = draft.Topic ?? "";
    obj["content"] = draft.Content;
    obj["timestamp"] = Convert.ToDouble(draft.UpdatedAt) / 1000;
    formatted.Add(obj);
  }

  return ok(formatted.ToArray());
};
