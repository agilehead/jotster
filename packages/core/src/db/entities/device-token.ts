import type { int, long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { IndexAttribute, PrimaryKeyAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class DeviceToken {
  WorkspaceId!: string;
  Id!: string;
  ParticipantId!: string;
  Provider!: string;
  TokenHash!: string;
  Enabled!: int;
  CreatedAt!: long;
  UpdatedAt!: long;
}

A<DeviceToken>().add(PrimaryKeyAttribute, "WorkspaceId", ["Id"]);
A<DeviceToken>().add(IndexAttribute, ["WorkspaceId","Provider","TokenHash"]);
A<DeviceToken>().add(IndexAttribute, ["WorkspaceId","ParticipantId"]);
