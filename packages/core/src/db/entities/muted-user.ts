import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class MutedUser {
  Id!: string;
  TenantId!: long;
  UserId!: long;
  MutedUserId!: long;
  CreatedAt!: long;
}

A.on(MutedUser)
  .prop((x) => x.Id)
  .add(KeyAttribute);
A.on(MutedUser).type.add(IndexAttribute, ["TenantId", "UserId", "MutedUserId"]);
A.on(MutedUser).type.add(IndexAttribute, ["TenantId", "UserId"]);
