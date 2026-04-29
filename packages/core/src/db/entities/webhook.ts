import type { int, long } from "@tsonic/core/types.js";

export class Webhook {
  WorkspaceId!: string;
  Id!: string;
  OwnerParticipantId!: string | null;
  Direction!: string;
  EventFilterJson!: string;
  TargetConfigJson!: string;
  SecretHash!: string | null;
  Enabled!: int;
  CreatedAt!: long;
  UpdatedAt!: long;
}
