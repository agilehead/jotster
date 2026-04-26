import type { int, long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { IndexAttribute, PrimaryKeyAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class Group {
  WorkspaceId!: string;
  Id!: string;
  Name!: string;
  Description!: string;
  BuiltIn!: int;
  State!: string;
  CreatedAt!: long;
  UpdatedAt!: long;
}

A<Group>().add(PrimaryKeyAttribute, "WorkspaceId", ["Id"]);
A<Group>().add(IndexAttribute, ["WorkspaceId","Name"]);
A<Group>().add(IndexAttribute, ["WorkspaceId","State"]);
