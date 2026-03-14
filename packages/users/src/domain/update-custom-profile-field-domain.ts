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
  required?: int;
  editableByUser?: int;
  useForUserMatching?: int;
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
    return err("Label cannot be blank.");
  }

  const existingFields = await getCustomProfileFields(options, actingUser.tenantId);
  let currentField = undefined as CustomProfileField | undefined;
  for (let i = 0; i < existingFields.length; i++) {
    if (existingFields[i].Id === fieldId) {
      currentField = existingFields[i];
      break;
    }
  }

  if (currentField === undefined) {
    return err("Field id " + fieldId + " not found.");
  }

  const nextName = input.name !== undefined ? input.name.trim() : currentField.Name;
  const nextFieldType = input.fieldType !== undefined ? input.fieldType : currentField.FieldType;
  const nextDisplayInProfileSummary = input.displayInProfileSummary !== undefined
    ? input.displayInProfileSummary
    : currentField.DisplayInProfileSummary;
  const nextUseForUserMatching = input.useForUserMatching !== undefined
    ? input.useForUserMatching
    : currentField.UseForUserMatching;

  for (let i = 0; i < existingFields.length; i++) {
    if (existingFields[i].Id !== fieldId && existingFields[i].Name === nextName) {
      return err("A field with that label already exists.");
    }
  }

  if (nextDisplayInProfileSummary === (1 as int) && nextFieldType === (6 as int)) {
    return err("Field type not supported for display in profile summary.");
  }

  if (nextUseForUserMatching === (1 as int) && nextFieldType !== (1 as int) && nextFieldType !== (7 as int)) {
    return err("Field type not supported for use for user matching.");
  }

  let displayInSummaryCount = 0 as int;
  for (let i = 0; i < existingFields.length; i++) {
    const field = existingFields[i];
    const include = field.Id === fieldId
      ? nextDisplayInProfileSummary
      : field.DisplayInProfileSummary;
    if (include === (1 as int)) {
      displayInSummaryCount = (displayInSummaryCount + 1) as int;
    }
  }
  if (displayInSummaryCount > (2 as int)) {
    return err("Only 2 custom profile fields can be displayed in the profile summary.");
  }

  const updated = await updateCustomProfileField(options, actingUser.tenantId, fieldId, {
    name: input.name !== undefined ? input.name.trim() : undefined,
    hint: input.hint !== undefined ? input.hint.trim() : undefined,
    fieldType: input.fieldType,
    fieldDataJson: input.fieldDataJson,
    displayInProfileSummary: input.displayInProfileSummary,
    required: input.required,
    editableByUser: input.editableByUser,
    useForUserMatching: input.useForUserMatching,
    ordering: input.ordering,
  });

  if (updated === undefined) {
    return err("Field id " + fieldId + " not found.");
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
