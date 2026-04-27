import type { int, long } from "@tsonic/core/types.js";

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
