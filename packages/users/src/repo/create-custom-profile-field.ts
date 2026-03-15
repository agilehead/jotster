import type { int, long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, CustomProfileField, generateId, allocatePublicId } from "@jotster/core/Jotster.Core.js";

interface CreateCustomProfileFieldInput {
  tenantId: string;
  name: string;
  hint: string;
  fieldType: int;
  fieldDataJson: string;
  displayInProfileSummary: int;
  required: int;
  editableByUser: int;
  useForUserMatching: int;
  ordering: int;
}

export const createCustomProfileField = async (
  options: DbContextOptions,
  input: CreateCustomProfileFieldInput
): Promise<CustomProfileField> => {
  const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;

  const field = new CustomProfileField();
  field.Id = generateId();
  field.PublicId = await allocatePublicId(options, "custom_profile_field");
  field.TenantId = input.tenantId;
  field.Name = input.name;
  field.Hint = input.hint;
  field.FieldType = input.fieldType;
  field.FieldDataJson = input.fieldDataJson;
  field.DisplayInProfileSummary = input.displayInProfileSummary;
  field.Required = input.required;
  field.EditableByUser = input.editableByUser;
  field.UseForUserMatching = input.useForUserMatching;
  field.Ordering = input.ordering;
  field.CreatedAt = now;

  const db = new JotsterDbContext(options);
  try {
    db.CustomProfileFields.Add(field);
    await db.SaveChangesAsync();
    return field;
  } finally {
    db.Dispose();
  }
};
