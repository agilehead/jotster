import type { long } from "@tsonic/core/types.js";

export class PermissionGrant {
  WorkspaceId!: string;
  Id!: string;
  SubjectKind!: string;
  SubjectId!: string;
  ResourcePath!: string;
  Action!: string;
  Effect!: string;
  CreatedAt!: long;
  ExpiresAt?: long;
}
