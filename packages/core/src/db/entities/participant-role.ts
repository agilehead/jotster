import type { long } from "@tsonic/core/types.js";

export class ParticipantRole {
  WorkspaceId!: string;
  ParticipantId!: string;
  RoleId!: string;
  CreatedAt!: long;
}
