import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { PrimaryKeyAttribute, IndexAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class Presence {
  UserId!: string;
  TenantId!: string;
  ClientName!: string;
  Status!: string;
  Timestamp!: long;
}

A.on(Presence).type.add(PrimaryKeyAttribute, "UserId", ["ClientName"]);
A.on(Presence).type.add(IndexAttribute, ["TenantId", "Timestamp"]);
A.on(Presence).type.add(IndexAttribute, ["TenantId", "UserId"]);
