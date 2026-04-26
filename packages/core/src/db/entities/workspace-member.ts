import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { IndexAttribute, PrimaryKeyAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class WorkspaceMember {
  WorkspaceId!: string;
  Id!: string;
  IdentityId!: string;
  State!: string;
  JoinedAt!: long;
  SuspendedAt?: long;
  CreatedAt!: long;
  UpdatedAt!: long;
}

A<WorkspaceMember>().add(PrimaryKeyAttribute, "WorkspaceId", ["Id"]);
A<WorkspaceMember>().add(IndexAttribute, ["WorkspaceId","IdentityId"]);
A<WorkspaceMember>().add(IndexAttribute, ["WorkspaceId","State"]);
