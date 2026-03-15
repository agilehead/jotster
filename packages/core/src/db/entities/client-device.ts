import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class ClientDevice {
  Id!: string;
  TenantId!: long;
  UserId!: long;
  CreatedAt!: long;
}

A.on(ClientDevice).prop((x) => x.Id).add(KeyAttribute);
A.on(ClientDevice).type.add(IndexAttribute, ["TenantId", "UserId"]);
