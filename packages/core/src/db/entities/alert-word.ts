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

A<AlertWord>()
  .prop((x) => x.Id)
  .add(KeyAttribute);
A<AlertWord>().add(IndexAttribute, ["TenantId", "UserId", "Word"]);
A<AlertWord>().add(IndexAttribute, ["TenantId", "UserId"]);
A<AlertWord>().add(IndexAttribute, ["TenantId"]);
