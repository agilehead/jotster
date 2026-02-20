import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class CustomProfileFieldValue {
  Id!: string;
  TenantId!: string;
  UserId!: string;
  FieldId!: string;
  Value!: string;
  RenderedValue?: string;
}

A.on(CustomProfileFieldValue).prop((x) => x.Id).add(KeyAttribute);
A.on(CustomProfileFieldValue).type.add(IndexAttribute, ["TenantId", "UserId"]);
A.on(CustomProfileFieldValue).type.add(IndexAttribute, ["FieldId"]);
