import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { IndexAttribute, PrimaryKeyAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class ParticipantRole {
  WorkspaceId!: string;
  ParticipantId!: string;
  RoleId!: string;
  CreatedAt!: long;
}

A<ParticipantRole>().add(PrimaryKeyAttribute, "WorkspaceId", ["ParticipantId","RoleId"]);
A<ParticipantRole>().add(IndexAttribute, ["WorkspaceId","RoleId"]);
