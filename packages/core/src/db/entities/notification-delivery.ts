import type { int, long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { IndexAttribute, PrimaryKeyAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class NotificationDelivery {
  WorkspaceId!: string;
  Id!: string;
  ParticipantId!: string;
  NotificationId!: string;
  EndpointId!: string;
  Status!: string;
  Attempts!: int;
  LastError?: string;
  NextAttemptAt?: long;
  CreatedAt!: long;
  UpdatedAt!: long;
}

A<NotificationDelivery>().add(PrimaryKeyAttribute, "WorkspaceId", ["Id"]);
A<NotificationDelivery>().add(IndexAttribute, ["WorkspaceId","NotificationId"]);
A<NotificationDelivery>().add(IndexAttribute, ["WorkspaceId","ParticipantId","NotificationId"]);
A<NotificationDelivery>().add(IndexAttribute, ["WorkspaceId","EndpointId","Status"]);
