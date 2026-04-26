import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { IndexAttribute, PrimaryKeyAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class PermissionGrant {
  WorkspaceId!: string;
  Id!: string;
  SubjectKind!: string;
  SubjectId!: string;
  ResourcePath!: string;
  Action!: string;
  Effect!: string;
  CreatedAt!: long;
  ExpiresAt?: long;
}

A<PermissionGrant>().add(PrimaryKeyAttribute, "WorkspaceId", ["Id"]);
A<PermissionGrant>().add(IndexAttribute, ["WorkspaceId","SubjectKind","SubjectId"]);
A<PermissionGrant>().add(IndexAttribute, ["WorkspaceId","ResourcePath","Action"]);
