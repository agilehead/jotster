import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { IndexAttribute, PrimaryKeyAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

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

A<Thread>().add(PrimaryKeyAttribute, "WorkspaceId", ["Id"]);
A<Thread>().add(IndexAttribute, ["WorkspaceId","ChannelId","Id"]);
A<Thread>().add(IndexAttribute, ["WorkspaceId","ChannelId","Title"]);
A<Thread>().add(IndexAttribute, ["WorkspaceId","State"]);
A<Thread>().add(IndexAttribute, ["WorkspaceId","CreatedByParticipantId"]);
