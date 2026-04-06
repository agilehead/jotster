import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import {
  PrimaryKeyAttribute,
  IndexAttribute,
} from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class Presence {
  UserId!: long;
  TenantId!: long;
  ClientName!: string;
  Status!: string;
  Timestamp!: long;
}

A<Presence>().add(PrimaryKeyAttribute, "UserId", ["ClientName"]);
A<Presence>().add(IndexAttribute, ["TenantId", "Timestamp"]);
A<Presence>().add(IndexAttribute, ["TenantId", "UserId"]);
