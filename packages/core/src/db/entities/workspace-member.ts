import type { long } from "@tsonic/core/types.js";

export class WorkspaceMember {
  WorkspaceId!: string;
  Id!: string;
  IdentityId!: string;
  State!: string;
  JoinedAt!: long;
  SuspendedAt?: long;
  CreatedAt!: long;
  UpdatedAt!: long;
}
