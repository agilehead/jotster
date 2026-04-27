import type { int, long } from "@tsonic/core/types.js";

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
