import type { int } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { CustomProfileField, ok, err } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { getCustomProfileFields } from "../repo/get-custom-profile-fields.ts";
import { createCustomProfileField } from "../repo/create-custom-profile-field.ts";

interface CreateFieldInput {
  name: string;
  hint?: string;
  fieldType: int;
  fieldDataJson?: string;
  displayInProfileSummary?: int;
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
    return err("Name is required");
  }

  // Determine ordering: place at end
  const existing = await getCustomProfileFields(options, actingUser.tenantId);
  let maxOrdering = 0 as int;
  for (let i = 0; i < existing.length; i++) {
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
    ordering: nextOrdering,
  });

  // Re-fetch all fields to broadcast current state
  const allFields = await getCustomProfileFields(options, actingUser.tenantId);
  const fieldsData = new List<Record<string, unknown>>();
  for (let i = 0; i < allFields.length; i++) {
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

  const eventData: Record<string, unknown> = {};
  eventData["fields"] = fieldsData.ToArray();
  dispatchEventToTenant(actingUser.tenantId, {
    type: "custom_profile_fields",
    data: eventData,
  });

  return ok(field);
};
