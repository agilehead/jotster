import type { long } from "@tsonic/core/types.js";

export class Thread {
  WorkspaceId!: string;
  Id!: string;
  ChannelId!: string;
  Title!: string;
  State!: string;
  AccessPolicy!: string;
  CreatedByParticipantId!: string;
  CreatedAt!: long;
  UpdatedAt!: long;
}
