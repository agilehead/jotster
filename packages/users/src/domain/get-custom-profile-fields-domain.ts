import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok } from "@jotster/core/Jotster.Core.js";
import { getCustomProfileFields } from "../repo/get-custom-profile-fields.ts";
import { mapCustomProfileFieldToCompatRecord } from "./map-custom-profile-field-to-compat-record.ts";

export const getCustomProfileFieldsDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
): Promise<Result<Record<string, unknown>[], string>> => {
  const dbFields = await getCustomProfileFields(options, user.tenantId);

  const fields: Record<string, unknown>[] = [];
  for (let i = 0; i < dbFields.length; i++) {
    fields.push(mapCustomProfileFieldToCompatRecord(dbFields[i]));
  }

  return ok(fields);
};
