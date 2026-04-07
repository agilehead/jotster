import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class DmGroup {
  Id!: string;
  TenantId!: long;
  GroupHash!: string;
  CreatedAt!: long;
}

A<DmGroup>()
  .prop((x) => x.Id)
  .add(KeyAttribute);
A<DmGroup>().add(IndexAttribute, ["TenantId", "GroupHash"]);
