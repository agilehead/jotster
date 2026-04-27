import type { int, long } from "@tsonic/core/types.js";

export class Role {
  WorkspaceId!: string;
  Id!: string;
  Name!: string;
  Description!: string;
  BuiltIn!: int;
  CreatedAt!: long;
  UpdatedAt!: long;
}
