import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class DmGroup {
  Id!: string;
  TenantId!: string;
  GroupHash!: string;
  CreatedAt!: long;
}

A.on(DmGroup).prop((x) => x.Id).add(KeyAttribute);
A.on(DmGroup).type.add(IndexAttribute, ["TenantId", "GroupHash"]);
