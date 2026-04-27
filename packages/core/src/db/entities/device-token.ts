import type { int, long } from "@tsonic/core/types.js";

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
