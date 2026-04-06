import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class CustomProfileFieldValue {
  Id!: string;
  TenantId!: long;
  UserId!: long;
  FieldId!: long;
  Value!: string;
  RenderedValue?: string;
}

A<CustomProfileFieldValue>()
  .prop((x) => x.Id)
  .add(KeyAttribute);
A<CustomProfileFieldValue>().add(IndexAttribute, ["TenantId", "UserId"]);
A<CustomProfileFieldValue>().add(IndexAttribute, ["FieldId"]);
