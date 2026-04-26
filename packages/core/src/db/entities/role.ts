import type { int, long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { IndexAttribute, PrimaryKeyAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class Role {
  WorkspaceId!: string;
  Id!: string;
  Name!: string;
  Description!: string;
  BuiltIn!: int;
  CreatedAt!: long;
  UpdatedAt!: long;
}

A<Role>().add(PrimaryKeyAttribute, "WorkspaceId", ["Id"]);
A<Role>().add(IndexAttribute, ["WorkspaceId","Name"]);
