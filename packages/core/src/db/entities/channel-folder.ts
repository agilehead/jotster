import type { int, long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class ChannelFolder {
  Id!: string;
  TenantId!: string;
  UserId!: string;
  Name!: string;
  Description!: string;
  IsArchived!: int;
  CreatedAt!: long;
  Ordering!: int;
  UpdatedAt!: long;
}

A.on(ChannelFolder).prop((x) => x.Id).add(KeyAttribute);
A.on(ChannelFolder).type.add(IndexAttribute, ["TenantId", "UserId", "Name"]);
A.on(ChannelFolder).type.add(IndexAttribute, ["TenantId", "UserId"]);
