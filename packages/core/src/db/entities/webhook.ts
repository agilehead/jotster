import type { int, long } from "@tsonic/core/types.js";

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
