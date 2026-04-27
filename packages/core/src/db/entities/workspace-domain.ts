import type { int, long } from "@tsonic/core/types.js";

export class WorkspaceDomain {
  Domain!: string;
  WorkspaceId!: string;
  IsPrimary!: int;
  State!: string;
  CreatedAt!: long;
  UpdatedAt!: long;
}
