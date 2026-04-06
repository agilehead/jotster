import type { int, long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class CustomProfileField {
  Id!: long;
  TenantId!: long;
  Name!: string;
  Hint!: string;
  FieldType!: int;
  FieldDataJson!: string;
  DisplayInProfileSummary!: int;
  Required!: int;
  EditableByUser!: int;
  UseForUserMatching!: int;
  Ordering!: int;
  CreatedAt!: long;
}

A<CustomProfileField>()
  .prop((x) => x.Id)
  .add(KeyAttribute);
A<CustomProfileField>().add(IndexAttribute, ["TenantId", "Ordering"]);
