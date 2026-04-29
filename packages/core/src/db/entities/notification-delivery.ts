import type { int, long } from "@tsonic/core/types.js";

export class NotificationDelivery {
  WorkspaceId!: string;
  Id!: string;
  ParticipantId!: string;
  NotificationId!: string;
  EndpointId!: string;
  Status!: string;
  Attempts!: int;
  LastError!: string | null;
  NextAttemptAt!: long | null;
  CreatedAt!: long;
  UpdatedAt!: long;
}
