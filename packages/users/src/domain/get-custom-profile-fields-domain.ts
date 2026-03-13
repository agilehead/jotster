import type { int } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { getCustomProfileFields } from "../repo/get-custom-profile-fields.ts";

export const getCustomProfileFieldsDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser
): Promise<Result<Record<string, unknown>[], string>> => {
  const dbFields = await getCustomProfileFields(options, user.tenantId);

  const fields = new List<Record<string, unknown>>();
  for (let i = 0; i < dbFields.length; i++) {
    const f = dbFields[i];
    const field: Record<string, unknown> = {};
    field["id"] = f.Id;
    field["name"] = f.Name;
    field["hint"] = f.Hint;
    field["type"] = f.FieldType;
    field["field_data"] = f.FieldDataJson;
    field["display_in_profile_summary"] = f.DisplayInProfileSummary === (1 as int);
    field["order"] = f.Ordering;
    fields.Add(field);
  }

  return ok(fields.ToArray());
};
