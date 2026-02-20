import type { int } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { getCustomProfileFields } from "../repo/get-custom-profile-fields.ts";
import { deleteCustomProfileField } from "../repo/delete-custom-profile-field.ts";

export const deleteCustomProfileFieldDomain = async (
  options: DbContextOptions,
  actingUser: AuthenticatedUser,
  fieldId: string
): Promise<Result<boolean, string>> => {
  if (actingUser.role > 200) {
    return err("Insufficient permission");
  }

  const deleted = await deleteCustomProfileField(options, actingUser.tenantId, fieldId);
  if (!deleted) {
    return err("Custom profile field not found");
  }

  // Re-fetch remaining fields to broadcast current state
  const allFields = await getCustomProfileFields(options, actingUser.tenantId);
  const fieldsData = new List<Record<string, unknown>>();
  for (let i = 0; i < allFields.Length; i++) {
    const f = allFields[i];
    const obj: Record<string, unknown> = {};
    obj["id"] = f.Id;
    obj["name"] = f.Name;
    obj["hint"] = f.Hint;
    obj["type"] = f.FieldType;
    obj["field_data"] = f.FieldDataJson;
    obj["display_in_profile_summary"] = f.DisplayInProfileSummary === (1 as int);
    obj["order"] = f.Ordering;
    fieldsData.Add(obj);
  }

  dispatchEventToTenant(actingUser.tenantId, {
    type: "custom_profile_fields",
    data: {
      fields: fieldsData.ToArray(),
    },
  });

  return ok(true);
};
