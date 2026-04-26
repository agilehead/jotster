import type { int, long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { IndexAttribute, PrimaryKeyAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class ChannelMember {
  WorkspaceId!: string;
  ChannelId!: string;
  ParticipantId!: string;
  Role!: string;
  State!: string;
  Muted!: int;
  NotificationLevel?: string;
  CreatedAt!: long;
  UpdatedAt!: long;
}

A<ChannelMember>().add(PrimaryKeyAttribute, "WorkspaceId", ["ChannelId","ParticipantId"]);
A<ChannelMember>().add(IndexAttribute, ["WorkspaceId","ParticipantId"]);
A<ChannelMember>().add(IndexAttribute, ["WorkspaceId","ChannelId","State"]);
