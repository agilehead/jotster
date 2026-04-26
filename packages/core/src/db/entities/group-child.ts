import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { IndexAttribute, PrimaryKeyAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class GroupChild {
  WorkspaceId!: string;
  ParentGroupId!: string;
  ChildGroupId!: string;
  CreatedAt!: long;
}

A<GroupChild>().add(PrimaryKeyAttribute, "WorkspaceId", ["ParentGroupId","ChildGroupId"]);
A<GroupChild>().add(IndexAttribute, ["WorkspaceId","ChildGroupId"]);
