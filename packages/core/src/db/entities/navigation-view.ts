import type { int, long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";
import { IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class NavigationView {
  Id!: long;
  TenantId!: long;
  UserId!: long;
  Fragment!: string;
  IsPinned!: int;
  Name?: string;
  CreatedAt!: long;
  UpdatedAt!: long;
}

A.on(NavigationView)
  .prop((x) => x.Id)
  .add(KeyAttribute);
A.on(NavigationView).type.add(IndexAttribute, [
  "TenantId",
  "UserId",
  "Fragment",
]);
A.on(NavigationView).type.add(IndexAttribute, ["TenantId", "UserId"]);
