import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class ApiKey {
  Id!: string;
  TenantId!: long;
  UserId!: long;
  KeyHash!: string;
  RawKey?: string;
  CreatedAt!: long;
  RevokedAt?: long;
}

A.on(ApiKey).prop((x) => x.Id).add(KeyAttribute);
A.on(ApiKey).type.add(IndexAttribute, ["TenantId", "UserId"]);
A.on(ApiKey).type.add(IndexAttribute, ["KeyHash"]);
