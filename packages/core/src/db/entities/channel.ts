import type { long } from "@tsonic/core/types.js";

export class Channel {
  WorkspaceId!: string;
  Id!: string;
  Name!: string;
  Description!: string;
  Visibility!: string;
  State!: string;
  CreatedByParticipantId?: string;
  CreatedAt!: long;
  UpdatedAt!: long;
}
