import type { int, long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { IndexAttribute, PrimaryKeyAttribute } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class AuthProvider {
  WorkspaceId!: string;
  Id!: string;
  Kind!: string;
  DisplayName!: string;
  Issuer!: string;
  ClientId!: string;
  ConfigJson!: string;
  Enabled!: int;
  CreatedAt!: long;
  UpdatedAt!: long;
}

A<AuthProvider>().add(PrimaryKeyAttribute, "WorkspaceId", ["Id"]);
A<AuthProvider>().add(IndexAttribute, ["WorkspaceId","DisplayName"]);
A<AuthProvider>().add(IndexAttribute, ["WorkspaceId","Kind"]);
A<AuthProvider>().add(IndexAttribute, ["WorkspaceId","Enabled"]);
