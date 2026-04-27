import type { long } from "@tsonic/core/types.js";

export class Notification {
  WorkspaceId!: string;
  Id!: string;
  ParticipantId!: string;
  ActivityType!: string;
  ObjectType!: string;
  ObjectId!: string;
  Reason!: string;
  PayloadJson!: string;
  CreatedAt!: long;
  ReadAt?: long;
  ConsumedAt?: long;
}
