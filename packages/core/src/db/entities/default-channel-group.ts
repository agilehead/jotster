import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class DefaultChannelGroup {
  Id!: string;
  TenantId!: long;
  Name!: string;
  Description!: string;
  CreatedAt!: long;
}

A.on(DefaultChannelGroup)
  .prop((x) => x.Id)
  .add(KeyAttribute);
A.on(DefaultChannelGroup).type.add(IndexAttribute, ["TenantId", "Name"]);
