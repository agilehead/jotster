import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class PushDeviceToken {
  Id!: string;
  TenantId!: long;
  UserId!: long;
  Kind!: string;
  Token!: string;
  IosAppId?: string;
  CreatedAt!: long;
}

A<PushDeviceToken>()
  .prop((x) => x.Id)
  .add(KeyAttribute);
A<PushDeviceToken>().add(IndexAttribute, ["TenantId", "UserId", "Token"]);
A<PushDeviceToken>().add(IndexAttribute, ["TenantId", "UserId"]);
