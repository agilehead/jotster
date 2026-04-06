import type { JsValue, long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { getCustomProfileFields } from "../repo/get-custom-profile-fields.ts";
import { deleteCustomProfileField } from "../repo/delete-custom-profile-field.ts";
import { mapCustomProfileFieldToCompatRecord } from "./map-custom-profile-field-to-compat-record.ts";

export const deleteCustomProfileFieldDomain = async (
  options: DbContextOptions,
  actingUser: AuthenticatedUser,
  fieldId: long,
): Promise<Result<boolean, string>> => {
  if (actingUser.role > 200) {
    return err("Insufficient permission");
  }

  const deleted = await deleteCustomProfileField(
    options,
    actingUser.tenantId,
    fieldId,
  );
  if (!deleted) {
    return err("Field id " + fieldId + " not found.");
  }

  // Re-fetch remaining fields to broadcast current state
  const allFields = await getCustomProfileFields(options, actingUser.tenantId);
  const fieldsData = new List<Record<string, JsValue>>();
  for (let i = 0; i < allFields.length; i++) {
    fieldsData.Add(mapCustomProfileFieldToCompatRecord(allFields[i]));
  }

  const eventData: Record<string, JsValue> = {};
  eventData["fields"] = fieldsData.ToArray();
  dispatchEventToTenant(actingUser.tenantId, {
    type: "custom_profile_fields",
    data: eventData,
  });

  return ok(true);
};
