import type { int, long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class CustomProfileField {
  Id!: string;
  TenantId!: string;
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

A.on(CustomProfileField).prop((x) => x.Id).add(KeyAttribute);
A.on(CustomProfileField).type.add(IndexAttribute, ["TenantId", "Ordering"]);
