import type { int } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { CustomProfileField, ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { getCustomProfileFields } from "../repo/get-custom-profile-fields.ts";
import { createCustomProfileField } from "../repo/create-custom-profile-field.ts";
import { mapCustomProfileFieldToCompatRecord } from "./map-custom-profile-field-to-compat-record.ts";

interface CreateFieldInput {
  name: string;
  hint?: string;
  fieldType: int;
  fieldDataJson?: string;
  displayInProfileSummary?: int;
  required?: int;
  editableByUser?: int;
  useForUserMatching?: int;
}

export const createCustomProfileFieldDomain = async (
  options: DbContextOptions,
  actingUser: AuthenticatedUser,
  input: CreateFieldInput
): Promise<Result<CustomProfileField, string>> => {
  if (actingUser.role > 200) {
    return err("Insufficient permission");
  }

  if (input.name.trim().length === 0) {
    return err("Label cannot be blank.");
  }

  if (input.displayInProfileSummary === (1 as int) && input.fieldType === (6 as int)) {
    return err("Field type not supported for display in profile summary.");
  }

  if (input.useForUserMatching === (1 as int) && input.fieldType !== (1 as int) && input.fieldType !== (7 as int)) {
    return err("Field type not supported for use for user matching.");
  }

  let displayInSummaryCount = 0 as int;
  const existing = await getCustomProfileFields(options, actingUser.tenantId);
  for (let i = 0; i < existing.length; i++) {
    if (existing[i].DisplayInProfileSummary === (1 as int)) {
      displayInSummaryCount = (displayInSummaryCount + 1) as int;
    }
  }

  if (input.displayInProfileSummary === (1 as int) && displayInSummaryCount >= (2 as int)) {
    return err("Only 2 custom profile fields can be displayed in the profile summary.");
  }

  // Determine ordering: place at end
  let maxOrdering = 0 as int;
  for (let i = 0; i < existing.length; i++) {
    if (existing[i].Name === input.name.trim()) {
      return err("A field with that label already exists.");
    }
    if (existing[i].Ordering > maxOrdering) {
      maxOrdering = existing[i].Ordering;
    }
  }
  const nextOrdering = (maxOrdering + 1) as int;

  const field = await createCustomProfileField(options, {
    tenantId: actingUser.tenantId,
    name: input.name.trim(),
    hint: input.hint !== undefined ? input.hint.trim() : "",
    fieldType: input.fieldType,
    fieldDataJson: input.fieldDataJson ?? "",
    displayInProfileSummary: input.displayInProfileSummary ?? (0 as int),
    required: input.required ?? (0 as int),
    editableByUser: input.editableByUser ?? (1 as int),
    useForUserMatching: input.useForUserMatching ?? (0 as int),
    ordering: nextOrdering,
  });

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

  return ok(field);
};
