import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class Draft {
  Id!: string;
  TenantId!: string;
  UserId!: string;
  Type!: string;
  ChannelId?: string;
  Topic?: string;
  RecipientIdsJson?: string;
  Content!: string;
  UpdatedAt!: long;
  CreatedAt!: long;
}

A.on(Draft).prop((x) => x.Id).add(KeyAttribute);
A.on(Draft).type.add(IndexAttribute, ["TenantId", "UserId"]);
