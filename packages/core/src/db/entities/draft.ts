import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class Draft {
  Id!: long;
  TenantId!: long;
  UserId!: long;
  Type!: string;
  ChannelId?: long;
  Topic?: string;
  RecipientIdsJson?: string;
  Content!: string;
  UpdatedAt!: long;
  CreatedAt!: long;
}

A<Draft>()
  .prop((x) => x.Id)
  .add(KeyAttribute);
A<Draft>().add(IndexAttribute, ["TenantId", "UserId"]);
