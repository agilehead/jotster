import type { int, long } from "@tsonic/core/types.js";

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
