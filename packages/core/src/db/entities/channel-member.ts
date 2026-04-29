import type { int, long } from "@tsonic/core/types.js";

export class ChannelMember {
  WorkspaceId!: string;
  ChannelId!: string;
  ParticipantId!: string;
  Role!: string;
  State!: string;
  Muted!: int;
  NotificationLevel!: string | null;
  CreatedAt!: long;
  UpdatedAt!: long;
}
