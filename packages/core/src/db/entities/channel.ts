import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { IndexAttribute, PrimaryKeyAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

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

A<Channel>().add(PrimaryKeyAttribute, "WorkspaceId", ["Id"]);
A<Channel>().add(IndexAttribute, ["WorkspaceId","Name"]);
A<Channel>().add(IndexAttribute, ["WorkspaceId","State"]);
A<Channel>().add(IndexAttribute, ["WorkspaceId","CreatedByParticipantId"]);
