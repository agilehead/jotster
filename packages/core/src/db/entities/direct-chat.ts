import type { long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { IndexAttribute, PrimaryKeyAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class DirectChat {
  WorkspaceId!: string;
  Id!: string;
  Kind!: string;
  State!: string;
  CreatedAt!: long;
  UpdatedAt!: long;
}

A<DirectChat>().add(PrimaryKeyAttribute, "WorkspaceId", ["Id"]);
A<DirectChat>().add(IndexAttribute, ["WorkspaceId","Kind","State"]);
