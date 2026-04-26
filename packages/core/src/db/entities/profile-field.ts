import type { int, long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { IndexAttribute, PrimaryKeyAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class ProfileField {
  WorkspaceId!: string;
  Id!: string;
  Key!: string;
  Label!: string;
  ValueKind!: string;
  Required!: int;
  CreatedAt!: long;
  UpdatedAt!: long;
}

A<ProfileField>().add(PrimaryKeyAttribute, "WorkspaceId", ["Id"]);
A<ProfileField>().add(IndexAttribute, ["WorkspaceId","Key"]);
