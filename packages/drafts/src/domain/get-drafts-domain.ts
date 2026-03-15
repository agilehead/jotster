import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { getDrafts } from "../repo/get-drafts.ts";
import { mapDraftToCompatRecord } from "./map-draft-to-compat-record.ts";

export const getDraftsDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser
): Promise<Result<Record<string, unknown>[], string>> => {
  const drafts = await getDrafts(options, user.tenantId, user.userId);

  const formatted = new List<Record<string, unknown>>();
  for (let i = 0; i < drafts.length; i++) {
    formatted.Add(mapDraftToCompatRecord(drafts[i]));
  }

  return ok(formatted.ToArray());
};
