import type { JsValue } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { getCustomProfileFields } from "../repo/get-custom-profile-fields.ts";
import { mapCustomProfileFieldToCompatRecord } from "./map-custom-profile-field-to-compat-record.ts";

export const getCustomProfileFieldsDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
): Promise<Result<Record<string, JsValue>[], string>> => {
  const dbFields = await getCustomProfileFields(options, user.tenantId);

  const fields = new List<Record<string, JsValue>>();
  for (let i = 0; i < dbFields.length; i++) {
    fields.Add(mapCustomProfileFieldToCompatRecord(dbFields[i]));
  }

  return ok(fields.ToArray());
};
