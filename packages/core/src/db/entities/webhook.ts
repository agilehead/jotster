import type { int, long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { IndexAttribute, PrimaryKeyAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class Webhook {
  WorkspaceId!: string;
  Id!: string;
  OwnerParticipantId?: string;
  Direction!: string;
  EventFilterJson!: string;
  TargetConfigJson!: string;
  SecretHash?: string;
  Enabled!: int;
  CreatedAt!: long;
  UpdatedAt!: long;
}

A<Webhook>().add(PrimaryKeyAttribute, "WorkspaceId", ["Id"]);
A<Webhook>().add(IndexAttribute, ["WorkspaceId","Direction","Enabled"]);
A<Webhook>().add(IndexAttribute, ["WorkspaceId","OwnerParticipantId"]);
