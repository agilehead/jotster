import type { int, long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { IndexAttribute, PrimaryKeyAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class NotificationEndpoint {
  WorkspaceId!: string;
  Id!: string;
  ParticipantId!: string;
  Kind!: string;
  ConfigJson!: string;
  Enabled!: int;
  CreatedAt!: long;
  UpdatedAt!: long;
}

A<NotificationEndpoint>().add(PrimaryKeyAttribute, "WorkspaceId", ["Id"]);
A<NotificationEndpoint>().add(IndexAttribute, ["WorkspaceId","ParticipantId","Id"]);
A<NotificationEndpoint>().add(IndexAttribute, ["WorkspaceId","ParticipantId","Kind"]);
A<NotificationEndpoint>().add(IndexAttribute, ["WorkspaceId","Enabled"]);
