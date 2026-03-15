import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class DefaultChannel {
  Id!: string;
  TenantId!: long;
  ChannelId!: long;
  CreatedAt!: long;
}

A.on(DefaultChannel)
  .prop((x) => x.Id)
  .add(KeyAttribute);
A.on(DefaultChannel).type.add(IndexAttribute, ["TenantId", "ChannelId"]);
