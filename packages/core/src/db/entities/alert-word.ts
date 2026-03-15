import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class AlertWord {
  Id!: string;
  TenantId!: long;
  UserId!: long;
  Word!: string;
  CreatedAt!: long;
}

A.on(AlertWord)
  .prop((x) => x.Id)
  .add(KeyAttribute);
A.on(AlertWord).type.add(IndexAttribute, ["TenantId", "UserId", "Word"]);
A.on(AlertWord).type.add(IndexAttribute, ["TenantId", "UserId"]);
A.on(AlertWord).type.add(IndexAttribute, ["TenantId"]);
