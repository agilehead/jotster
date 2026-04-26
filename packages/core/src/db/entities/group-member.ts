import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { IndexAttribute, PrimaryKeyAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class GroupMember {
  WorkspaceId!: string;
  GroupId!: string;
  ParticipantId!: string;
  CreatedAt!: long;
}

A<GroupMember>().add(PrimaryKeyAttribute, "WorkspaceId", ["GroupId","ParticipantId"]);
A<GroupMember>().add(IndexAttribute, ["WorkspaceId","ParticipantId"]);
