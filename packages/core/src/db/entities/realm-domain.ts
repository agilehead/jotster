import type { int, long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class RealmDomain {
  Id!: string;
  TenantId!: long;
  Domain!: string;
  AllowSubdomains!: int;
  CreatedAt!: long;
}

A.on(RealmDomain)
  .prop((x) => x.Id)
  .add(KeyAttribute);
A.on(RealmDomain).type.add(IndexAttribute, ["TenantId", "Domain"]);
