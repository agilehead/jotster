import type { int } from "@tsonic/core/types.js";
import type { CustomProfileField } from "@jotster/core/Jotster.Core.js";

export const mapCustomProfileFieldToCompatRecord = (
  field: CustomProfileField,
): Record<string, unknown> => {
  const record: Record<string, unknown> = {};
  record["id"] = field.Id;
  record["name"] = field.Name;
  record["hint"] = field.Hint;
  record["type"] = field.FieldType;
  record["field_data"] = field.FieldDataJson;
  record["order"] = field.Ordering;
  if (field.DisplayInProfileSummary === (1 as int)) {
    record["display_in_profile_summary"] = true;
  }
  record["required"] = field.Required === (1 as int);
  record["editable_by_user"] = field.EditableByUser === (1 as int);
  if (field.UseForUserMatching === (1 as int)) {
    record["use_for_user_matching"] = true;
  }
  return record;
};
