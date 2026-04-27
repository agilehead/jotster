import type { long } from "@tsonic/core/types.js";

export class GroupMember {
  WorkspaceId!: string;
  GroupId!: string;
  ParticipantId!: string;
  CreatedAt!: long;
}
