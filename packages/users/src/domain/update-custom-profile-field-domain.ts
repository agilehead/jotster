import type { int } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { CustomProfileField, ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { getCustomProfileFields } from "../repo/get-custom-profile-fields.ts";
import { updateCustomProfileField } from "../repo/update-custom-profile-field.ts";
import { mapCustomProfileFieldToCompatRecord } from "./map-custom-profile-field-to-compat-record.ts";

interface UpdateFieldInput {
  name?: string;
  hint?: string;
  fieldType?: int;
  fieldDataJson?: string;
  displayInProfileSummary?: int;
  ordering?: int;
}

export const updateCustomProfileFieldDomain = async (
  options: DbContextOptions,
  actingUser: AuthenticatedUser,
  fieldId: string,
  input: UpdateFieldInput
): Promise<Result<CustomProfileField, string>> => {
  if (actingUser.role > 200) {
    return err("Insufficient permission");
  }

  if (input.name !== undefined && input.name.trim().length === 0) {
    return err("Name must not be empty");
  }

  const updated = await updateCustomProfileField(options, actingUser.tenantId, fieldId, {
    name: input.name !== undefined ? input.name.trim() : undefined,
    hint: input.hint !== undefined ? input.hint.trim() : undefined,
    fieldType: input.fieldType,
    fieldDataJson: input.fieldDataJson,
    displayInProfileSummary: input.displayInProfileSummary,
    ordering: input.ordering,
  });

  if (updated === undefined) {
    return err("Custom profile field not found");
  }

  // Re-fetch all fields to broadcast current state
  const allFields = await getCustomProfileFields(options, actingUser.tenantId);
  const fieldsData: Record<string, unknown>[] = [];
  for (let i = 0; i < allFields.length; i++) {
    fieldsData.push(mapCustomProfileFieldToCompatRecord(allFields[i]));
  }

  const eventData: Record<string, unknown> = {};
  eventData["fields"] = fieldsData;
  dispatchEventToTenant(actingUser.tenantId, {
    type: "custom_profile_fields",
    data: eventData,
  });

  return ok(updated);
};
