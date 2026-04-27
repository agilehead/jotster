import type { long } from "@tsonic/core/types.js";

export class DirectChatMember {
  WorkspaceId!: string;
  DirectChatId!: string;
  ParticipantId!: string;
  State!: string;
  CreatedAt!: long;
}
